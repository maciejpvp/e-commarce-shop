import { UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/docClient";

const tableName = process.env.TABLE_NAME!;

export const updateCartItem = async (userId: string, productId: string, quantity: number) => {
    const commandInput: UpdateCommandInput = {
        TableName: tableName,
        Key: {
            PK: `USER#${userId}`,
            SK: `CART#${productId}`,
        },
        UpdateExpression: "SET quantity = :quantity, updated_at = :updated_at, version = version + :inc",
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