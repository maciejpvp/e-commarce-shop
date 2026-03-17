import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { UserAddress } from "../../dynamoDbTypes";
import { validateAddress } from "./validateAddress";
import { docClient } from "../../utils/docClient";
import { withCors } from "../../utils/cors";

const tableName = process.env.TABLE_NAME;

export const handler = async (event: any) => {
    const userId = event.requestContext.authorizer?.sub;
    const body = event.body ? JSON.parse(event.body) : {};
    
    const validatedAddress = validateAddress(body.address || body);

    const addressItem: UserAddress = {
        PK: `USER#${userId}`,
        SK: `ADDRESS#${validatedAddress.name}`,
        street: validatedAddress.street,
        city: validatedAddress.city,
        state: validatedAddress.state,
        zip_code: validatedAddress.zip_code || validatedAddress["zip-code"] || "",
        country: validatedAddress.country,
        is_default: body.isDefault ?? false,
    };

    try {
        await saveAddressWithLimitCheck(userId, addressItem);
    } catch (error) {
        return handleError(error);
    }
    return withCors({
        statusCode: 201,
        body: JSON.stringify({ message: "Address added successfully" }),
    });
};

async function saveAddressWithLimitCheck(userId: string, addressItem: UserAddress) {
    const transaction = new TransactWriteCommand({
        TransactItems: [
            {
                Put: {
                    TableName: tableName,
                    Item: addressItem,
                },
            },
            {
                Update: {
                    TableName: tableName,
                    Key: { PK: `USER#${userId}`, SK: "METADATA" },
                    UpdateExpression: "SET address_count = if_not_exists(address_count, :zero) + :inc",
                    ConditionExpression: "attribute_not_exists(address_count) OR address_count < :max",
                    ExpressionAttributeValues: {
                        ":inc": 1,
                        ":zero": 0,
                        ":max": 3,
                    },
                },
            },
        ],
    });

    return await docClient.send(transaction);
}

function handleError(error: any) {
    if (error.name === "TransactionCanceledException") {
        const reasons = error.CancellationReasons;

        if (reasons[1]?.Code === "ConditionalCheckFailed") {
            return withCors({
                statusCode: 403, // Forbidden
                body: JSON.stringify({ 
                    error: "LIMIT_EXCEEDED",
                    message: `You have reached the maximum limit of 3 addresses.` 
                }),
            });
        }

        if (reasons[0]?.Code === "ConditionalCheckFailed") {
            return withCors({
                statusCode: 409, // Conflict
                body: JSON.stringify({ 
                    error: "DUPLICATE_NAME",
                    message: "An address with this name already exists for your account." 
                }),
            });
        }
    }

    console.error("Unexpected Error:", error);
    return withCors({
        statusCode: 500,
        body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: error.message }),
    });
}