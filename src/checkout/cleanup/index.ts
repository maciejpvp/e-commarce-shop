import {
    DeleteCommand,
    QueryCommand,
    BatchWriteCommand,
    BatchWriteCommandInput
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../utils/docClient';

const TABLE_NAME = process.env.TABLE_NAME;

interface CleanupPayload {
    cleanupData: {
        PK: string;
        SK: string;
        orderId: string;
    };
}

interface StepFunctionErrorEvent {
    Error: string;
    Cause: string;
}

export const handler = async (event: StepFunctionErrorEvent): Promise<void> => {
    try {
        const cleanupData = parseErrorMetadata(event);

        if (!cleanupData) {
            console.warn("No cleanup data found in event cause. Skipping.");
            return;
        }

        const { PK, SK, orderId } = cleanupData;

        // Delete the main Order Summary
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { PK, SK }
        }));

        // Fetch all related Order Items
        const orderItems = await getOrderItems(orderId);

        if (orderItems.length > 0) {
            // Batch delete items (handles chunks of 25)
            await batchDeleteOrderItems(orderItems);
        }

        console.log(`Cleanup successful for Order: ${orderId}`);
    } catch (error) {
        console.error("Cleanup failed. Throwing to Step Function for retry:", error);
        throw error; // Crucial for Step Function backoff
    }
};

const parseErrorMetadata = (event: StepFunctionErrorEvent) => {
    try {
        const sfnCause = JSON.parse(event.Cause);
        // Step Functions often wrap the original error message
        const payload: CleanupPayload = typeof sfnCause.errorMessage === 'string'
            ? JSON.parse(sfnCause.errorMessage)
            : sfnCause.errorMessage;

        return payload?.cleanupData || null;
    } catch (e) {
        console.error("Failed to parse Step Function metadata", e);
        return null;
    }
};

const getOrderItems = async (orderId: string) => {
    const items: Record<string, any>[] = [];
    let lastEvaluatedKey: any = undefined;

    // Use a loop to handle pagination if an order has many items
    do {
        const response = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `ORDER#${orderId}`,
                ":sk": "ITEM#"
            },
            ExclusiveStartKey: lastEvaluatedKey
        }));

        if (response.Items) items.push(...response.Items);
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items.map(item => ({ PK: item.PK, SK: item.SK }));
};

const batchDeleteOrderItems = async (items: { PK: string; SK: string }[]) => {
    // DynamoDB BatchWriteItem has a limit of 25 items per request
    const BATCH_SIZE = 25;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);

        const deleteRequests = chunk.map(item => ({
            DeleteRequest: {
                Key: { PK: item.PK, SK: item.SK }
            }
        }));

        const input: BatchWriteCommandInput = {
            RequestItems: {
                [TABLE_NAME!]: deleteRequests
            }
        };

        const result = await docClient.send(new BatchWriteCommand(input));

        if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
            throw new Error("Batch delete had unprocessed items due to throttling.");
        }
    }
};