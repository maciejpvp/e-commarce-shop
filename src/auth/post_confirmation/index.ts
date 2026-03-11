import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const tableName = process.env.TABLE_NAME;

export const handler: PostConfirmationTriggerHandler = async (event) => {
    console.log("Post Confirmation Event Received:", JSON.stringify(event, null, 2));

    const userAttributes = event.request.userAttributes;

    if (userAttributes['cognito:user_status'] !== 'CONFIRMED') return event;

    const userProfile = {
        PK: `USER#${userAttributes.sub}`,
        SK: 'PROFILE',
        email: userAttributes.email,
        first_name: userAttributes.given_name,
        last_name: userAttributes.family_name,
        phone_number: userAttributes.phone_number,
        created_at: new Date().toISOString(),
        version: 1,
        gsi1pk: `EMAIL#${userAttributes.email}`,
        gsi1sk: 'PROFILE',
    }

    const putItemCommand = new PutCommand({
        TableName: tableName,
        Item: userProfile,
    });

    await docClient.send(putItemCommand);

    return event;
};