import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";
import { withCors } from "../../utils/cors";

const tableName = process.env.TABLE_NAME;

export const handler = async (event: any) => {
    const userId = event.requestContext.authorizer?.sub;
    const commandInput: QueryCommandInput = {
        TableName: tableName,
        ExpressionAttributeNames: {
            "#pk": "PK",
            "#sk": "SK",
        },
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
        ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":sk": "ADDRESS#",
        },
    }

    const command = new QueryCommand(commandInput)
    const response = await docClient.send(command)

    const items = response.Items?.map((item) => {
        return {
            name: item.SK.split("#")[1],
            street: item.street,
            city: item.city,
            state: item.state,
            zip_code: item.zip_code,
            country: item.country,
            is_default: item.is_default,
        }
    })

    return withCors({
        statusCode: 200,
        body: JSON.stringify(items),
    })
}