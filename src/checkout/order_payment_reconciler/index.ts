import { EventBridgeEvent } from "aws-lambda";
import { getOrderToken } from "../../services/order";

import {
    SFNClient,
    SendTaskSuccessCommand,
    SendTaskFailureCommand,
} from "@aws-sdk/client-sfn";

const sfnClient = new SFNClient({});

export const isSuccess = (eventType: string): boolean => {
    const successEvents = [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    ];
    return successEvents.includes(eventType);
};

export const handler = async (event: EventBridgeEvent<string, any>) => {
    const eventType = event["detail-type"];
    const success = isSuccess(eventType);

    console.log(`Processing ${eventType} - Success: ${success}`);

    if (success) {
        console.log("Fulfilling order...");

        const session = event.detail.data.object;
        const metadata = session.metadata;

        if (!metadata) {
            throw new Error("No metadata found in the session");
        }

        const { PK, SK } = metadata;

        const token = await getOrderToken(PK, SK);

        await handleWorkflow(token, success, { PK, SK });

        console.log("PK: ", PK);
        console.log("SK: ", SK);
    } else {
        console.log("Session not successful or pending.");
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            received: true,
            type: eventType,
            isSuccess: success,
        }),
    };
};

type Order = { PK: string; SK: string };

async function handleWorkflow(
    taskToken: string,
    isSuccess: boolean,
    order: Order
) {
    const output = {
        Payload: {
            status: isSuccess ? "SUCCESS" : "FAILED",
            processedAt: new Date().toISOString(),
            order,
        },
    };

    try {
        if (isSuccess) {
            await sfnClient.send(
                new SendTaskSuccessCommand({
                    taskToken,
                    output: JSON.stringify(output),
                })
            );
        } else {
            await sfnClient.send(
                new SendTaskFailureCommand({
                    taskToken,
                    error: "WorkflowError",
                    cause: "Manual or logic failure",
                })
            );
        }
    } catch (err: any) {
        throw err;
    }
}