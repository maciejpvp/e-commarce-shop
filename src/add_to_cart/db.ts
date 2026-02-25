import { GetCommand, GetCommandInput, PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/docClient";

export const getPriceAtAdd = async (productId: string) => {
    const commandInput: GetCommandInput = {
        TableName: process.env.TABLE_NAME,
        Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
        },
    };

    const command = new GetCommand(commandInput);
    const response = await docClient.send(command);

    const item = response.Item;
    if (!item) {
        throw new Error("Product not found");
    }

    return item.price / 100; // convert to cents
}

type AddToCartParams = {
    userId: string;
    productId: string;
    quantity: number;
    priceAtAdd: number;
}

export const addToCart = async (params: AddToCartParams) => {
    const { userId, productId, quantity, priceAtAdd } = params;

    const cartItem = {
        PK: `USER#${userId}`,
        SK: `CART#${productId}`,
        quantity,
        price_at_add: priceAtAdd,
        created_at: Date.now(),
        updated_at: Date.now(),
        version: 1
    };

    const commandInput: PutCommandInput = {
        TableName: process.env.TABLE_NAME,
        Item: cartItem,
        ConditionExpression: "attribute_not_exists(PK)",
    };

    const command = new PutCommand(commandInput);
    await docClient.send(command);
}