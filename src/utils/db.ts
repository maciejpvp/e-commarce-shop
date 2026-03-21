import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, BatchWriteCommandInput, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

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

export const executeBatchWrite = async (
    tableName: string,
    requests: ({ DeleteRequest: { Key: Record<string, any> } } | { PutRequest: { Item: Record<string, any> } })[],
    maxRetries = 5
): Promise<void> => {
    // 1. Chunk the requests into arrays of 25 (DynamoDB limit)
    const chunks = [];
    for (let i = 0; i < requests.length; i += 25) {
        chunks.push(requests.slice(i, i + 25));
    }

    // 2. Process chunks in parallel (or sequential if you prefer lower RCU/WCU spikes)
    await Promise.all(
        chunks.map((chunk) => retryBatch(tableName, chunk, maxRetries))
    );
};

/**
 * Internal helper to handle the UnprocessedItems loop for a single batch
 */
const retryBatch = async (
    tableName: string,
    batch: any[],
    maxRetries: number,
    attempt = 0
): Promise<void> => {
    const command = new BatchWriteCommand({
        RequestItems: {
            [tableName]: batch,
        },
    });

    const { UnprocessedItems } = await docClient.send(command);

    // If there are unprocessed items and we haven't hit the retry limit
    if (UnprocessedItems && UnprocessedItems[tableName] && UnprocessedItems[tableName]!.length > 0) {
        if (attempt >= maxRetries) {
            throw new Error(`Exceeded max retries for BatchWrite on table ${tableName}`);
        }

        // Exponential backoff: 100ms, 200ms, 400ms...
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Recursive call with only the items that failed
        return retryBatch(tableName, UnprocessedItems[tableName]!, maxRetries, attempt + 1);
    }
};