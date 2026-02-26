import { QueryCommand, QueryCommandInput, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";
import { Product, UserCart } from "../../dynamoDbTypes";

const tableName = process.env.TABLE_NAME!;

export const handler = async ({ userId }: { userId: string }) => {
    try {

        console.log("@@@@ USER ID: ", userId)

        const cartItems = await getCartItems(userId);
        console.log("@@@@ CART ITEMS: ", cartItems)

        if (!cartItems) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Cart empty" }),
            };
        }

        const productIds = cartItems.map((item) => item.SK.split("#")[1]);
        const fullProducts = await getFullProducts(productIds);
        console.log("@@@@ FULL PRODUCTS: ", fullProducts)

        const validCartItems = cartItems.filter((item) => {
            const productId = item.SK.split("#")[1];
            const productMetadata = fullProducts.find(p => p.PK === `PRODUCT#${productId}`);
            if (!productMetadata) return false;
            return productMetadata.stock >= item.quantity;
        });

        if (validCartItems.length !== cartItems.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid cart items" }),
            };
        }

        const fullCartItems = validCartItems.map((item) => {
            const productId = item.SK.split("#")[1];
            const productMetadata = fullProducts.find(p => p.PK === `PRODUCT#${productId}`);
            if (!productMetadata) return false;
            return {
                ...item,
                productMetadata,
            };
        }).filter((item) => item !== false);

        console.log("@@@@ FULL CART ITEMS: ", fullCartItems)

        const cartPrice = fullCartItems.reduce((acc, item) => acc + item.productMetadata?.price * item.quantity, 0);

        return {
            statusCode: 200,
            body: JSON.stringify({ fullCartItems, cartPrice }),
        };

    } catch (error) {
        console.log("@@@@ ERROR: ", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
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
    let fullProducts: Product[] = [];
    for (const productId of productIds) {
        const product = await getProductById(productId);
        fullProducts.push(product);
    }
    return fullProducts;
}

async function getProductById(productId: string): Promise<Product> {
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
        throw new Error(`Product ${productId} not found`);
    }

    const item = response.Items[0] as Product;

    return item;
}