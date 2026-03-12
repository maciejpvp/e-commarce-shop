import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { executeQuery } from "../utils/db";
import { docClient } from "../utils/docClient";
import { ProductMetadata, ProductCategory } from "../types";
import { Product } from "../dynamoDbTypes";

const tableName = process.env.TABLE_NAME!;
const INDEX = "GSI1";

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getProductsByCategory = (category: string) => {
    const command = new QueryCommand({
        TableName: tableName,
        IndexName: INDEX,
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: { ":pk": `CATEGORY#${category}` },
    });
    return executeQuery(command);
};

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

export const getProductCategories = (productId: string) => {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#pk = :pk and begins_with(#sk, :sk)",
        ExpressionAttributeValues: {
            ":pk": `PRODUCT#${productId}`,
            ":sk": `CATEGORY`,
        },
        ExpressionAttributeNames: { "#sk": "SK", "#pk": "PK" },
    });
    return executeQuery(command);
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