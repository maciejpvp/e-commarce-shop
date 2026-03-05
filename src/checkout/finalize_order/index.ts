import { UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";

type Order = {
    PK: string;
    SK: string;
}

type EventType = {
    status: "SUCCESS" | "FAILED";
    processedAt: string;
    order: Order;
}

const tableName = process.env.TABLE_NAME;

export const handler = async (event: EventType) => {

    const { status, order } = event;

    const isSuccess = status === "SUCCESS";

    if (isSuccess) {
        await handleSuccess(order);
    } else {
        await handleFailure(order);
    }

    const orderId = order.PK.split("#")[1];

    return {
        status,
        orderId
    }

}

const handleSuccess = async (order: Order) => {
    const commandInput: UpdateCommandInput = {
        TableName: tableName,
        Key: {
            PK: order.PK,
            SK: order.SK
        },
        UpdateExpression: "set #s = :s",
        ExpressionAttributeNames: {
            "#s": "status"
        },
        ExpressionAttributeValues: {
            ":s": "PAID"
        }
    }

    const command = new UpdateCommand(commandInput);

    await docClient.send(command);
}

const handleFailure = async (order: Order) => {
    const commandInput: UpdateCommandInput = {
        TableName: tableName,
        Key: {
            PK: order.PK,
            SK: order.SK
        },
        UpdateExpression: "set #s = :s",
        ExpressionAttributeNames: {
            "#s": "status"
        },
        ExpressionAttributeValues: {
            ":s": "CANCELLED"
        }
    }

    const command = new UpdateCommand(commandInput);

    await docClient.send(command);
}
