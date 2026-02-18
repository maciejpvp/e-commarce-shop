import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PreSignUpTriggerEvent, Context } from 'aws-lambda';
import Joi from 'joi';

type UserAttributes = {
    email: string;
    phone_number: string;
    given_name: string;
    family_name: string;
    birthdate: string;
    gender: string;
};

const schema = Joi.object<UserAttributes>({
    email: Joi.string().email().lowercase().trim().required(),
    phone_number: Joi.string()
        .pattern(/^\+[1-9]\d{1,14}$/)
        .messages({ 'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)' })
        .required(),
    given_name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    family_name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),
    birthdate: Joi.date()
        .iso()
        .max(new Date(new Date().setFullYear(new Date().getFullYear() - 13)))
        .messages({
            'date.max': 'You must be at least 13 years old.',
            'date.format': 'Birthdate must be in ISO format (YYYY-MM-DD).'
        })
        .required(),
    gender: Joi.string()
        .valid('male', 'female', 'non-binary', 'prefer-not-to-say')
        .insensitive()
        .required(),
});

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const tableName = process.env.TABLE_NAME;

export const handler = async (
    event: PreSignUpTriggerEvent,
): Promise<PreSignUpTriggerEvent> => {
    console.log("Received Cognito Pre Sign-Up Event:", JSON.stringify(event, null, 2));

    const userAttributes = event.request.userAttributes as UserAttributes;

    const validationResult = schema.validate(userAttributes, { abortEarly: false });

    if (validationResult.error) {
        console.log("Validation Error:", validationResult.error);
        throw new Error(validationResult.error.message);
    }

    const email = userAttributes.email;

    const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :gsi1pk and gsi1sk = :gsi1sk',
        ExpressionAttributeValues: {
            ':gsi1pk': `EMAIL#${email}`,
            ':gsi1sk': 'PROFILE'
        }
    });

    const response = await docClient.send(command);

    const items = response.Items ?? [];

    if (items.length > 0) {
        throw new Error('The email address is already associated with another account');
    }

    return event;
};