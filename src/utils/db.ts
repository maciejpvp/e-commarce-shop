import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const executeQuery = async (command: QueryCommand) => {
    try {
        const response = await docClient.send(command);
        return response.Items ?? [];
    } catch (error) {
        console.error("DynamoDB Query Error:", error);
        throw error;
    }
};

