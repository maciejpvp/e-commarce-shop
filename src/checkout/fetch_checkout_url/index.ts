import { GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";
import { validate } from "./schema";

const tableName = process.env.TABLE_NAME;

const fetchCheckoutUrl = async (userId: string, orderId: string): Promise<string | null> => {
    const commandInput: GetCommandInput = {
        TableName: tableName,
        Key: {
            PK: `USER#${userId}`,
            SK: `ORDER#${orderId}`,
        },
        ProjectionExpression: "sessionUrl"
    }

    const command = new GetCommand(commandInput);
    const result = await docClient.send(command);

    const item = result.Item;

    if (!item) {
        return null;
    }

    return item.sessionUrl;
}

export const handler = async (event: any) => {

    const userId = event.requestContext.authorizer?.sub;
    const orderId = event.pathParameters?.orderId;

    const validatedData = validate({ userId, orderId });

    const sessionUrl = await fetchCheckoutUrl(validatedData.userId, validatedData.orderId);

    if (!sessionUrl) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Checkout not found" }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ sessionUrl }),
    };      
};