import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";
import { withCors } from "../../utils/cors";

const tableName = process.env.TABLE_NAME;

export const handler = async (event: any) => {
    const userId = event.requestContext.authorizer?.sub;
    const addressName = event.pathParameters?.addressName;

    const transaction = new TransactWriteCommand({
        TransactItems: [
            {
                Delete: {
                    TableName: tableName,
                    Key: {
                        PK: `USER#${userId}`,
                        SK: `ADDRESS#${addressName}`,
                    },
                    ConditionExpression: "attribute_exists(PK)",
                },
            },
            {
                Update: {
                    TableName: tableName,
                    Key: { PK: `USER#${userId}`, SK: "METADATA" },
                    UpdateExpression: "SET address_count = address_count - :dec",
                    ConditionExpression: "address_count > :zero",
                    ExpressionAttributeValues: {
                        ":dec": 1,
                        ":zero": 0,
                    },
                },
            },
        ],
    });

    try {
        await docClient.send(transaction);
    } catch (error: any) {
        if (error.name === "TransactionCanceledException") {
            const reasons = error.CancellationReasons;
            if (reasons[0]?.Code === "ConditionalCheckFailed") {
                return withCors({
                    statusCode: 404,
                    body: JSON.stringify({ error: "NOT_FOUND", message: "Address not found" }),
                });
            }
        }
        console.error("Delete Error:", error);
        return withCors({
            statusCode: 500,
            body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: error.message }),
        });
    }

    return withCors({
        statusCode: 200,
        body: JSON.stringify({ message: "Address deleted successfully" }),
    });
};