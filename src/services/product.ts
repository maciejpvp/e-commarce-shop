import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { decodeToken, encodeToken, executeQuery } from "../utils/db";
import { docClient } from "../utils/docClient";
import { ProductMetadata, ProductCategory } from "../types";
import { Product } from "../dynamoDbTypes";
import { ResponseProduct } from "../product/upload_product/types";
import { unslugify } from "../utils/slugify";

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
export const getProductItem = async (productIds: string[]): Promise<Product[]> => {
    const products: Product[] = [];
    for (const productId of productIds) {
        const command = new GetCommand({
            TableName: tableName,
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA",
            },
        });
        const response = await docClient.send(command);
        products.push(response.Item as Product);
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


export const transformProduct = (product: Product, categories: string[]): ResponseProduct => {
    return {
        id: product.PK.split("#")[1],
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categories: categories.map((category) => ({
            name: unslugify(category),
            slug: category,
        })),
        tech_spec: product.tech_spec ? JSON.parse(product.tech_spec) : undefined,
        attributes: product.attributes ? JSON.parse(product.attributes): undefined,
        media: Array.isArray(product.media) ? product.media : JSON.parse(product.media as unknown as string),
        version: product.version,
    };
};