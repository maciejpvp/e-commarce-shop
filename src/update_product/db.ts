import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);
const tableName = process.env.TABLE_NAME!;

export interface UpdateProductParams {
    productId: string;
    updateExpression: string;
    expressionAttributeNames: Record<string, string>;
    expressionAttributeValues: Record<string, any>;
}

export async function updateProductInDynamoDB({
    productId,
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
}: UpdateProductParams) {
    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(PK)",
        ReturnValues: "ALL_NEW",
    });

    const response = await docClient.send(command);
    return response.Attributes;
}
