import { QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/docClient";

const TABLE_NAME = process.env.TABLE_NAME!;
const TRANSACTION_LIMIT = 50;

export const handler = async (event: any) => {
    if (event.isSuccess) return;

    const { orderId } = event;
    if (!orderId) throw new Error("Missing orderId");

    await unReserveStock(orderId);

    return {
        message: "Stock unreserved successfully",
        orderId
    };
};

async function unReserveStock(orderId: string) {
    const items = await fetchAllOrderItems(orderId);

    const eligibleItems = items.filter(item => !item.stockUnreserved);

    if (eligibleItems.length === 0) {
        console.log(`All items for Order ${orderId} are already unreserved or no items found.`);
        return;
    }

    const chunks = [];
    for (let i = 0; i < eligibleItems.length; i += TRANSACTION_LIMIT) {
        chunks.push(eligibleItems.slice(i, i + TRANSACTION_LIMIT));
    }

    for (const [index, chunk] of chunks.entries()) {
        const transactItems: any[] = [];

        for (const item of chunk) {
            transactItems.push({
                Update: {
                    TableName: TABLE_NAME,
                    Key: { PK: `PRODUCT#${item.productId}`, SK: "METADATA" },
                    UpdateExpression: "SET stock = if_not_exists(stock, :zero) + :qty",
                    ExpressionAttributeValues: { ":qty": item.quantity, ":zero": 0 },
                },
            });

            transactItems.push({
                Update: {
                    TableName: TABLE_NAME,
                    Key: { PK: `ORDER#${orderId}`, SK: item.SK },
                    UpdateExpression: "SET stockUnreserved = :true",
                    ConditionExpression: "attribute_not_exists(stockUnreserved) OR stockUnreserved = :false",
                    ExpressionAttributeValues: { ":true": true, ":false": false },
                },
            });
        }

        try {
            await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
            console.log(`Chunk ${index + 1} processed for Order ${orderId}`);
        } catch (err: any) {
            if (err.name === "TransactionCanceledException") {
                console.warn(`Transaction for chunk ${index + 1} cancelled. Items likely already processed.`);
                continue;
            }
            throw err;
        }
    }
}

async function fetchAllOrderItems(orderId: string) {
    let allItems: any[] = [];
    let lastEvaluatedKey = undefined;

    do {
        const result: any = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ExpressionAttributeValues: {
                ":pk": `ORDER#${orderId}`,
                ":skPrefix": "ITEM#",
            },
            ExclusiveStartKey: lastEvaluatedKey,
        }));

        if (result.Items) allItems.push(...result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
}