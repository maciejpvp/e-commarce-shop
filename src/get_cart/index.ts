import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/docClient";

const tableName = process.env.TABLE_NAME;

export const handler = async (event: any) => {
    const userId = event.requestContext.authorizer.sub;

    const cart = await getCart(userId);

    return {
        statusCode: 200,
        body: JSON.stringify({ cart }),
    };
}

const getCart = async (userId: string) => {
    const commandInput: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":sk": "CART#"
        }
    }

    const command = new QueryCommand(commandInput);
    const response = await docClient.send(command);
    return response.Items;
}
