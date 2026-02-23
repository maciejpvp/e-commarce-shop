import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const tableName = process.env.TABLE_NAME;
const INDEX = "GSI1"

const executeQuery = async (command: QueryCommand) => {
    try {
        const response = await docClient.send(command);
        return response.Items ?? [];
    } catch (error) {
        console.error("DynamoDB Query Error:", error);
        throw error;
    }
};

export const getProductsByCategory = (category: string) => {
    const command = new QueryCommand({
        TableName: tableName,
        IndexName: INDEX,
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: { ":pk": `CATEGORY#${category}` }
    });
    return executeQuery(command);
};

export const getProductDetails = (productId: string) => {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#pk = :pk and begins_with(#sk, :sk)",
        ExpressionAttributeValues: { ":pk": `PRODUCT#${productId}`, ":sk": `METADATA` },
        ExpressionAttributeNames: { "#sk": "SK", "#pk": "PK" }
    });
    return executeQuery(command);
};