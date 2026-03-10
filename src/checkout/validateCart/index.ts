import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";
import { Product, UserCart } from "../../dynamoDbTypes";

const tableName = process.env.TABLE_NAME!;

export const handler = async ({ userId }: { userId: string }) => {
    try {
        const cartItems = await getCartItems(userId);

        if (!cartItems || cartItems.length === 0) {
            return {
                statusCode: 404,
                body: { message: "Cart empty" },
            };
        }

        const productIds = cartItems.map((item) => item.SK.split("#")[1]);
        const fullProducts = await getFullProducts(productIds);
        const productMap = new Map(fullProducts.map(p => [p.PK, p]));

        const enrichedCartItems = [];
        let fullPrice = 0;

        for (const item of cartItems) {
            const productId = item.SK.split("#")[1];
            const product = productMap.get(`PRODUCT#${productId}`);

            if (!product) {
                return {
                    statusCode: 400,
                    body: { message: `Product ${productId} not found` },
                };
            }

            if (product.stock < item.quantity) {
                return {
                    statusCode: 400,
                    body: { message: `Insufficient stock for product ${product.name}` },
                };
            }

            // Merge cart item with product metadata, excluding overlapping PK/SK if needed
            // but here we keep them as they are part of the "full cart item"
            enrichedCartItems.push({
                ...item,
                ...product,
                productId,
            });

            fullPrice += product.price * item.quantity;
        }

        return {
            statusCode: 200,
            body: {
                cartItems: enrichedCartItems,
                fullPrice,
                userId
            },
        };

    } catch (error) {
        console.error("@@@@ ERROR: ", error);
        return {
            statusCode: 500,
            body: { message: "Internal server error" },
        };
    }
};

async function getCartItems(userId: string): Promise<UserCart[]> {
    const commandInput: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: "PK = :userId and begins_with(SK, :cart)",
        ExpressionAttributeValues: {
            ":userId": `USER#${userId}`,
            ":cart": "CART",
        },
    }
    const command = new QueryCommand(commandInput);
    const response = await docClient.send(command);

    const items = response.Items as UserCart[];

    return items;
}

async function getFullProducts(productIds: string[]): Promise<Product[]> {
    const products = await Promise.all(productIds.map(id => getProductById(id)));
    return products.filter((p): p is Product => p !== null);
}

async function getProductById(productId: string): Promise<Product | null> {
    const commandInput: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: "PK = :productId and SK = :metadata",
        ExpressionAttributeValues: {
            ":productId": `PRODUCT#${productId}`,
            ":metadata": "METADATA",
        },
    }
    const command = new QueryCommand(commandInput);
    const response = await docClient.send(command);

    if (!response.Items || response.Items.length === 0) {
        return null;
    }

    const item = response.Items[0] as Product;

    return item;
}