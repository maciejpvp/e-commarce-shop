import { DynamoDBStreamEvent } from "aws-lambda";

export const handler = async (event: DynamoDBStreamEvent) => {
    console.log("event: ", event)
    return {
        statusCode: 200,
        body: {
            message: "Checkout URL sent successfully"
        },
    };
}   