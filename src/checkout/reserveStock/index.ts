import { docClient } from "../../utils/docClient";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.TABLE_NAME!;

type EventProps = {
    cartItems: any[];
    fullProducts: any[];
}

export const handler = async (event: EventProps) => {
    try {
        const products = event.cartItems.map((item) => {
            return {
                productId: item.SK.split("#")[1],
                quantity: item.quantity,
            };
        });
        await reserveStock({ products });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Stock reserved successfully" }),
        };
    } catch (error) {
        console.log("@@@@ ERROR: ", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
}

type ReserveStockProps = {
    products: {
        productId: string;
        quantity: number;
    }[];
}

async function reserveStock({ products }: ReserveStockProps) {
    const transactItems = products.map((item) => {
        return {
            Update: {
                TableName: tableName,
                Key: {
                    PK: `PRODUCT#${item.productId}`,
                    SK: "METADATA",
                },
                UpdateExpression: "SET stock = stock - :qty",
                ConditionExpression: "attribute_exists(PK) AND stock >= :qty",
                ExpressionAttributeValues: {
                    ":qty": item.quantity,
                },
            },
        };
    });

    try {
        await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
        return { success: true };
    } catch (error: any) {
        if (error.name === "TransactionCanceledException") {
            const isOutOfStock = error.CancellationReasons?.some(
                (r: any) => r.Code === "ConditionalCheckFailed"
            );

            if (isOutOfStock) {
                throw new Error("One or more items are no longer available in the requested quantity.");
            }
        }
        throw error;
    }
}