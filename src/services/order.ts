import {
    BatchWriteCommand,
    BatchWriteCommandInput,
    DeleteCommand,
    GetCommand,
    PutCommand,
    PutCommandInput,
    QueryCommand,
    TransactWriteCommand,
    UpdateCommand,
    UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { OrderItem, OrderSummary } from "../dynamoDbTypes";
import { docClient } from "../utils/docClient";

const TABLE_NAME = process.env.TABLE_NAME!;

// ─── Order Summary ────────────────────────────────────────────────────────────

export const saveOrderSummary = async (object: OrderSummary): Promise<void> => {
    const commandInput: PutCommandInput = {
        TableName: TABLE_NAME,
        Item: object,
    };
    const command = new PutCommand(commandInput);
    await docClient.send(command);
};

export const saveOrderItem = async (orderItem: OrderItem): Promise<void> => {
    const commandInput: PutCommandInput = {
        TableName: TABLE_NAME,
        Item: orderItem,
    };
    const command = new PutCommand(commandInput);
    await docClient.send(command);
};

export const updateOrderStatus = async (
    order: { PK: string; SK: string },
    status: "PAID" | "CANCELLED"
): Promise<void> => {
    const commandInput: UpdateCommandInput = {
        TableName: TABLE_NAME,
        Key: {
            PK: order.PK,
            SK: order.SK,
        },
        UpdateExpression: "set #s = :s",
        ExpressionAttributeNames: {
            "#s": "status",
        },
        ExpressionAttributeValues: {
            ":s": status,
        },
    };
    const command = new UpdateCommand(commandInput);
    await docClient.send(command);
};

export const getOrderToken = async (PK: string, SK: string): Promise<string> => {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK, SK },
        ProjectionExpression: "#t",
        ExpressionAttributeNames: { "#t": "token" },
    });

    const response = await docClient.send(command);
    const item = response.Item as OrderSummary | undefined;
    if (!item) {
        throw new Error(`Order not found for PK: ${PK}, SK: ${SK}`);
    }

    return item.token;
};

// ─── Order Items ──────────────────────────────────────────────────────────────

export const getOrderItems = async (
    orderId: string
): Promise<{ PK: string; SK: string }[]> => {
    const items: Record<string, any>[] = [];
    let lastEvaluatedKey: any = undefined;

    do {
        const response = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues: {
                    ":pk": `ORDER#${orderId}`,
                    ":sk": "ITEM#",
                },
                ExclusiveStartKey: lastEvaluatedKey,
            })
        );

        if (response.Items) items.push(...response.Items);
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items.map((item) => ({ PK: item.PK, SK: item.SK }));
};

export const getOrderItemsTyped = async (
    orderId: string
): Promise<OrderItem[]> => {
    const items: OrderItem[] = [];
    let lastEvaluatedKey: any = undefined;

    do {
        const response = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues: {
                    ":pk": `ORDER#${orderId}`,
                    ":sk": "ITEM#",
                },
                ExclusiveStartKey: lastEvaluatedKey,
            })
        );

        if (response.Items) items.push(...(response.Items as OrderItem[]));
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
};

export const deleteOrderSummary = async (PK: string, SK: string): Promise<void> => {
    await docClient.send(
        new DeleteCommand({ TableName: TABLE_NAME, Key: { PK, SK } })
    );
};

export const batchDeleteOrderItems = async (
    items: { PK: string; SK: string }[]
): Promise<void> => {
    const BATCH_SIZE = 25;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);

        const deleteRequests = chunk.map((item) => ({
            DeleteRequest: { Key: { PK: item.PK, SK: item.SK } },
        }));

        const input: BatchWriteCommandInput = {
            RequestItems: { [TABLE_NAME]: deleteRequests },
        };

        const result = await docClient.send(new BatchWriteCommand(input));

        if (
            result.UnprocessedItems &&
            Object.keys(result.UnprocessedItems).length > 0
        ) {
            throw new Error(
                "Batch delete had unprocessed items due to throttling."
            );
        }
    }
};

// ─── Stock Management ─────────────────────────────────────────────────────────

type ReserveStockItem = { productId: string; quantity: number };

export const reserveStockTransaction = async (
    products: ReserveStockItem[]
): Promise<void> => {
    const transactItems = products.map((item) => ({
        Update: {
            TableName: TABLE_NAME,
            Key: {
                PK: `PRODUCT#${item.productId}`,
                SK: "METADATA",
            },
            UpdateExpression: "SET stock = stock - :qty",
            ConditionExpression: "attribute_exists(PK) AND stock >= :qty",
            ExpressionAttributeValues: { ":qty": item.quantity },
        },
    }));

    try {
        await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
    } catch (error: any) {
        if (error.name === "TransactionCanceledException") {
            const isOutOfStock = error.CancellationReasons?.some(
                (r: any) => r.Code === "ConditionalCheckFailed"
            );
            if (isOutOfStock) {
                throw new Error(
                    "One or more items are no longer available in the requested quantity."
                );
            }
        }
        throw error;
    }
};

export const fetchAllOrderItemsForUnreserve = async (
    orderId: string
): Promise<any[]> => {
    let allItems: any[] = [];
    let lastEvaluatedKey: any = undefined;

    do {
        const result: any = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression:
                    "PK = :pk AND begins_with(SK, :skPrefix)",
                ExpressionAttributeValues: {
                    ":pk": `ORDER#${orderId}`,
                    ":skPrefix": "ITEM#",
                },
                ExclusiveStartKey: lastEvaluatedKey,
            })
        );

        if (result.Items) allItems.push(...result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
};

type UnreserveItem = { productId: string; quantity: number; SK: string };

export const unreserveStockTransaction = async (
    items: UnreserveItem[],
    orderId: string
): Promise<void> => {
    const TRANSACTION_LIMIT = 50;
    const chunks: UnreserveItem[][] = [];

    for (let i = 0; i < items.length; i += TRANSACTION_LIMIT) {
        chunks.push(items.slice(i, i + TRANSACTION_LIMIT));
    }

    for (const [index, chunk] of chunks.entries()) {
        const transactItems: any[] = [];

        for (const item of chunk) {
            transactItems.push({
                Update: {
                    TableName: TABLE_NAME,
                    Key: { PK: `PRODUCT#${item.productId}`, SK: "METADATA" },
                    UpdateExpression:
                        "SET stock = if_not_exists(stock, :zero) + :qty",
                    ExpressionAttributeValues: {
                        ":qty": item.quantity,
                        ":zero": 0,
                    },
                },
            });

            transactItems.push({
                Update: {
                    TableName: TABLE_NAME,
                    Key: { PK: `ORDER#${orderId}`, SK: item.SK },
                    UpdateExpression: "SET stockUnreserved = :true",
                    ConditionExpression:
                        "attribute_not_exists(stockUnreserved) OR stockUnreserved = :false",
                    ExpressionAttributeValues: {
                        ":true": true,
                        ":false": false,
                    },
                },
            });
        }

        try {
            await docClient.send(
                new TransactWriteCommand({ TransactItems: transactItems })
            );
            console.log(`Chunk ${index + 1} processed for Order ${orderId}`);
        } catch (err: any) {
            if (err.name === "TransactionCanceledException") {
                console.warn(
                    `Transaction for chunk ${index + 1} cancelled. Items likely already processed.`
                );
                continue;
            }
            throw err;
        }
    }
};
