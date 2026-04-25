import { QueryCommand, PutCommand, UpdateCommand, GetCommand, DeleteCommandInput, DeleteCommand, PutCommandInput, TransactWriteCommandInput, TransactWriteCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { decodeToken, encodeToken, executeQuery } from "../utils/db";
import { docClient } from "../utils/docClient";
import { ProductMetadata, ProductCategory } from "../types";
import { Product } from "../dynamoDbTypes";
import { ResponseProduct } from "../product/upload_product/types";
import { unslugify } from "../utils/slugify";
import { chunkArray } from "src/utils/chunkArray";

const tableName = process.env.TABLE_NAME!;
const INDEX = "GSI1";

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getProductsByCategory = async ({
    category,
    limit = 10,
    nextToken
}: {
    category: string;
    limit?: number;
    nextToken?: string;
}) => {
    const command = new QueryCommand({
        TableName: tableName,
        IndexName: INDEX,
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: {
            ":pk": `CATEGORY#${category}`
        },
        Limit: Math.max(1, Number(limit)),
        ExclusiveStartKey: decodeToken(nextToken),
    });

    const { Items = [], LastEvaluatedKey } = await docClient.send(command);

    return {
        products: Items,
        nextToken: encodeToken(LastEvaluatedKey),
    };
};

/**
 * Get product metadata for multiple product IDs
 * @param productIds - Array of product IDs
 * @returns Array of product metadata
 */
export const getProductItem = async (
    productIds: string[],
    attributes?: (keyof Product)[]
): Promise<Partial<Product>[]> => {
    const products: Partial<Product>[] = [];

    for (const productId of productIds) {
        const command = new GetCommand({
            TableName: tableName,
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA",
            },
            // Only fetch specific attributes if provided
            ProjectionExpression: attributes?.join(", "),
        });

        const response = await docClient.send(command);

        if (response.Item) {
            products.push(response.Item as Partial<Product>);
        }
    }

    return products;
};

export const getProductCategories = async (productId: string) => {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#pk = :pk and begins_with(#sk, :sk)",
        ExpressionAttributeValues: {
            ":pk": `PRODUCT#${productId}`,
            ":sk": `CATEGORY`,
        },
        ExpressionAttributeNames: { "#sk": "SK", "#pk": "PK" },
    });
    const response = await docClient.send(command);
    return response.Items?.map((item) => item.SK.split("#")[1]) || [];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export const uploadProductMetadata = async (
    metadata: ProductMetadata
): Promise<void> => {
    const putItemCommand = new PutCommand({
        TableName: tableName,
        Item: metadata,
    });
    await docClient.send(putItemCommand);
};

export const uploadProductCategory = async (
    categories: ProductCategory[]
): Promise<void> => {
    for (const category of categories) {
        const putItemCommand = new PutCommand({
            TableName: tableName,
            Item: category,
        });
        await docClient.send(putItemCommand);
    }
};

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateProductParams {
    productId: string;
    updateExpression: string;
    expressionAttributeNames: Record<string, string>;
    expressionAttributeValues: Record<string, any>;
    conditionExpression: string;
}

export const updateProduct = async ({
    productId,
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
    conditionExpression,
}: UpdateProductParams) => {
    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: conditionExpression,
        ReturnValues: "ALL_NEW",
    });

    const response = await docClient.send(command);
    return response.Attributes;
};


export const transformProduct = (product: Partial<Product>, categories: string[], variants?: Product[]): ResponseProduct => {
    return {
        id: product.PK?.split("#")[1] ?? "",
        name: product.name ?? "",
        description: product.description ?? "",
        price: product.price ?? -1,
        stock: product.stock ?? -1,
        categories: categories.map((category) => ({
            name: unslugify(category),
            slug: category,
        })),
        tech_spec: product.tech_spec ? JSON.parse(product.tech_spec) : undefined,
        attributes: product.attributes ? JSON.parse(product.attributes) : undefined,
        media: product.media
            ? Array.isArray(product.media)
                ? product.media
                : JSON.parse(product.media as unknown as string)
            : [],
        group: product.gsi1pk?.split("#")[1],
        version: product.version ?? -1,
        variants: variants?.map((variant) => transformProduct(variant, [])),
    };
};

export const removeCategoryFromProduct = async (props: { productId: string, category: string }) => {
    const { productId, category } = props;

    const commandInput: DeleteCommandInput = {
        TableName: tableName,
        Key: {
            PK: `PRODUCT#${productId}`,
            SK: `CATEGORY#${category}`,
        },
    };

    const command = new DeleteCommand(commandInput);
    await docClient.send(command);
};

export const addCategoryToProduct = async (props: { productId: string, category: string, price?: number }) => {
    const { productId, category, price } = props;

    let productPrice = price;
    if (!price) {
        const product = (await getProductItem([productId], ["price"])).at(0);

        if (!product) throw new Error("Product not found");

        productPrice = product.price;
    }

    if (!productPrice) throw new Error("Product price not found");

    const productCategory: ProductCategory = {
        PK: `PRODUCT#${productId}`,
        SK: `CATEGORY#${category}`,
        gsi1pk: `CATEGORY#${category}`,
        gsi1sk: `PRICE#${productPrice}#${productId}`,
    };

    const commandInput: PutCommandInput = {
        TableName: tableName,
        Item: productCategory,
    };

    const command = new PutCommand(commandInput);
    await docClient.send(command);
}

// Group
type AddGroupToProductsProps = {
    productIds: string[];
    group: string;
}

/**
 * Associates multiple products with a specific group.
 * @param {Object} props - The configuration object.
 * @param {string[]} props.productIds - Array of unique product IDs to update.
 * @param {string} props.group - The group identifier to assign to the products.
 * @returns {Promise<boolean>} isSuccess.
 */
export const addGroupToProducts = async (props: AddGroupToProductsProps): Promise<boolean> => {
    try {
        const { productIds, group } = props;

        if (productIds.length > 50) throw new Error("Too many products at once, max 50 allowed");

        const tasks = productIds.map((productId) => {
            const command = new UpdateCommand({
                TableName: tableName,
                Key: {
                    PK: `PRODUCT#${productId}`,
                    SK: "METADATA",
                },
                UpdateExpression: "SET #gsi1pk = :gsi1pk, #gsi1sk = :gsi1sk",
                ExpressionAttributeNames: {
                    "#gsi1pk": "gsi1pk",
                    "#gsi1sk": "gsi1sk",
                },
                ExpressionAttributeValues: {
                    ":gsi1pk": `GROUP#${group}`,
                    ":gsi1sk": `PRODUCT#${productId}`,
                },
            });
            return docClient.send(command);
        });

        await Promise.all(tasks);
        return true;
    } catch (error) {
        console.error(`!!!ERROR in addGroupToProducts: ${error}`);
        return false;
    }
};

/**
 * Removes a group from products.
 * @param {string[]} productIds - Array of unique product IDs to update.
 * @returns {Promise<boolean>} isSuccess.
 */
export const removeGroupFromProducts = async (productIds: string[]): Promise<boolean> => {
    try {
        if (productIds.length > 50) throw new Error("Too many products at once, max 50 allowed");

        const tasks = productIds.map((productId) => {
            const command = new UpdateCommand({
                TableName: tableName,
                Key: {
                    PK: `PRODUCT#${productId}`,
                    SK: "METADATA",
                },
                UpdateExpression: "REMOVE #gsi1pk, #gsi1sk",
                ExpressionAttributeNames: {
                    "#gsi1pk": "gsi1pk",
                    "#gsi1sk": "gsi1sk",
                },
            });
            return docClient.send(command);
        });

        await Promise.all(tasks);
        return true;
    } catch (error) {
        console.error(`!!!ERROR in removeGroupFromProducts: ${error}`);
        return false;
    }
};

/**
 * Retrieves products by group.
 * Used for getting all variants of an product.
 * @param {string} group - The group identifier.
 * @returns {Promise<Product[]>} Array of products.
 */
export const getProductsByGroup = async (group: string) => {
    const commandInput: QueryCommandInput = {
        TableName: tableName,
        IndexName: INDEX,
        KeyConditionExpression: "#gsi1pk = :gsi1pk",
        ProjectionExpression: "#id, #name, #media",
        ExpressionAttributeNames: {
            "#gsi1pk": "gsi1pk",
            "#id": "PK",
            "#name": "name",
            "#media": "media",
        },
        ExpressionAttributeValues: {
            ":gsi1pk": `GROUP#${group}`,
        },
    };

    const command = new QueryCommand(commandInput);
    const response = await docClient.send(command);
    return response.Items as Product[];
}