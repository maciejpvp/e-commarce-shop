import { docClient } from "../../utils/docClient";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.TABLE_NAME!;

export const handler = async (cartItems: any[], fullProducts: any[]) => {
    try {
        await reserveStock(cartItems, fullProducts);
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

async function reserveStock(cartItems: any[], fullProducts: any[]) {
    const transactItems = cartItems.map((item) => {
        const productId = item.SK.split("#")[1];
        // Find the matching product metadata to get the current version
        const productMetadata = fullProducts.find(p => p.PK === `PRODUCT#${productId}`);

        if (!productMetadata) throw new Error(`Product ${productId} not found`);

        return {
            Update: {
                TableName: tableName,
                Key: {
                    PK: `PRODUCT#${productId}`,
                    SK: "METADATA",
                },
                // Decrement stock and increment version
                UpdateExpression: "SET stock = stock - :qty, version = version + :inc",
                // Condition: Ensure enough stock exists AND version hasn't changed
                ConditionExpression: "stock >= :qty AND version = :v",
                ExpressionAttributeValues: {
                    ":qty": item.quantity, // Assumes your cart item has a quantity attribute
                    ":inc": 1,
                    ":v": productMetadata.version,
                },
            },
        };
    });

    const command = new TransactWriteCommand({
        TransactItems: transactItems,
    });

    await docClient.send(command);
}