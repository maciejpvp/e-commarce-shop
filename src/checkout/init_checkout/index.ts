import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { APIGatewayProxyEvent } from "aws-lambda";
import { withCors } from "../../utils/cors";
import { v4 as uuidv4 } from 'uuid';
import { GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";
import { UserAddress } from "../../dynamoDbTypes";

const sfnClient = new SFNClient({});
const STATE_MACHINE_ARN = process.env.CHECKOUT_SFN_ARN;

const initCheckout = async (userId: string, orderId: string, address: UserAddress) => {
    const params = {
        stateMachineArn: STATE_MACHINE_ARN,
        input: JSON.stringify({
            userId,
            orderId,
            address,
            initiatedAt: new Date().toISOString()
        }),
        name: `checkout-${userId}-${Date.now()}`
    };

    const command = new StartExecutionCommand(params);
    return await sfnClient.send(command);
};

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log("EVENT:", event);
    try {
        const userId = event.requestContext.authorizer?.sub;
        const body = event.body ? JSON.parse(event.body) : {};

        const addressId = body.addressId;

        const address = await getAddress(userId, addressId);

        const orderId = uuidv4();

        if (!userId) {
            return withCors({
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized" }),
            });
        }

        const result = await initCheckout(userId, orderId, address);

        return withCors({
            statusCode: 202,
            body: JSON.stringify({
                message: "Checkout started",
                executionArn: result.executionArn,
                orderId,
            }),
        });
    } catch (error: any) {
        console.error("Workflow trigger failed:", error);
        return withCors({
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
        });
    }
};

async function getAddress(userId: string, addressId: string): Promise<UserAddress> {
    const commandInput: GetCommandInput = {
        TableName: process.env.TABLE_NAME,
        Key: {
            PK: `USER#${userId}`,
            SK: `ADDRESS#${addressId}`,
        },
    };

    const command = new GetCommand(commandInput);
    const result = await docClient.send(command);
    
    const item = result.Item as UserAddress | undefined;

    if (!item) {
        throw new Error("Address not found");
    }

    return item;
}