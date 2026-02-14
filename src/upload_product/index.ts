import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    // Log the event so you can see it in CloudWatch
    console.log("Received uploadProduct event:", JSON.stringify(event, null, 2));

    const body = event.body ? JSON.parse(event.body) : {};

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Product upload event received successfully",
            receivedData: body,
        }),
    };
};