import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { validatePartialAddress } from "../upload_address/validateAddress";
import { docClient } from "../../utils/docClient";
import { withCors } from "../../utils/cors";

const tableName = process.env.TABLE_NAME;

export const handler = async (event: any) => {
    const userId = event.requestContext.authorizer?.sub;
    const addressSlug = event.pathParameters?.addressName;
    const body = event.body ? JSON.parse(event.body) : {};

    if (body.name !== undefined) {
        return withCors({
            statusCode: 400,
            body: JSON.stringify({ 
                error: "IMMUTABLE_ATTRIBUTE", 
                message: "Changing the address name is not allowed in this operation. To rename an address, please delete and recreate it." 
            }),
        });
    }

    let validatedData;
    try {
        validatedData = validatePartialAddress(body.address || body);
    } catch (error: any) {
        return withCors({
            statusCode: 400,
            body: JSON.stringify({ error: "VALIDATION_ERROR", message: error.message }),
        });
    }

    const updates = Object.entries(validatedData).filter(([key, val]) => val !== undefined && key !== "name");

    if (updates.length === 0) {
        return withCors({
            statusCode: 400,
            body: JSON.stringify({ error: "NO_CHANGES", message: "No valid fields provided for update." }),
        });
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    updates.forEach(([key, value]) => {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        
        const dbField = key === "zip-code" ? "zip_code" : key;

        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = dbField;
        expressionAttributeValues[attributeValue] = value;
    });

    try {
        await docClient.send(new UpdateCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `ADDRESS#${addressSlug}`,
            },
            UpdateExpression: `SET ${updateExpressions.join(", ")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: "attribute_exists(PK)", // Ensure address exists
        }));

        return withCors({
            statusCode: 200,
            body: JSON.stringify({ message: "Address updated successfully" }),
        });

    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            return withCors({
                statusCode: 404,
                body: JSON.stringify({ error: "NOT_FOUND", message: "Address not found." }),
            });
        }

        console.error("Edit Address Error:", error);
        return withCors({
            statusCode: 500,
            body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: error.message }),
        });
    }
};
