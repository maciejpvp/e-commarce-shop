import {
    DeleteCommand,
    GetCommand,
    GetCommandInput,
    PutCommand,
    PutCommandInput,
    QueryCommand,
    QueryCommandInput,
    UpdateCommand,
    UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/docClient";
import { UserCart } from "../dynamoDbTypes";

const tableName = process.env.TABLE_NAME!;

// ─── Product price lookup for cart add ───────────────────────────────────────

export const getProductPriceForCart = async (productId: string): Promise<number> => {
    const commandInput: GetCommandInput = {
        TableName: tableName,
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
};

// ─── Cart CRUD ────────────────────────────────────────────────────────────────

type AddToCartParams = {
    userId: string;
    productId: string;
    quantity: number;
    priceAtAdd: number;
};

export const addToCart = async (params: AddToCartParams): Promise<void> => {
    const { userId, productId, quantity, priceAtAdd } = params;

    const cartItem = {
        PK: `USER#${userId}`,
        SK: `CART#${productId}`,
        quantity,
        price_at_add: priceAtAdd,
        created_at: Date.now(),
        updated_at: Date.now(),
        version: 1,
    };

    const commandInput: PutCommandInput = {
        TableName: tableName,
        Item: cartItem,
        ConditionExpression: "attribute_not_exists(PK)",
    };

    const command = new PutCommand(commandInput);
    await docClient.send(command);
};

export const getCart = async (userId: string) => {
    const commandInput: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":sk": "CART#",
        },
    };

    const command = new QueryCommand(commandInput);
    const response = await docClient.send(command);
    return response.Items;
};

export const getCartItems = async (userId: string): Promise<UserCart[]> => {
    const commandInput: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: "PK = :userId and begins_with(SK, :cart)",
        ExpressionAttributeValues: {
            ":userId": `USER#${userId}`,
            ":cart": "CART",
        },
    };

    const command = new QueryCommand(commandInput);
    const response = await docClient.send(command);
    return response.Items as UserCart[];
};

export const updateCartItem = async (
    userId: string,
    productId: string,
    quantity: number
): Promise<void> => {
    const commandInput: UpdateCommandInput = {
        TableName: tableName,
        Key: {
            PK: `USER#${userId}`,
            SK: `CART#${productId}`,
        },
        UpdateExpression:
            "SET quantity = :quantity, updated_at = :updated_at, version = version + :inc",
        ExpressionAttributeValues: {
            ":quantity": quantity,
            ":updated_at": Date.now(),
            ":inc": 1,
        },
        ConditionExpression: "attribute_exists(PK)",
    };

    const command = new UpdateCommand(commandInput);
    await docClient.send(command);
};

export const deleteCartItem = async (
    userId: string,
    productId: string
): Promise<void> => {
    const command = new DeleteCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${userId}`,
            SK: `CART#${productId}`,
        },
    });
    await docClient.send(command);
};
