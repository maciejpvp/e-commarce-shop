import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ProductCategory, ProductMetadata } from './types';

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const tableName = process.env.TABLE_NAME!;

export async function uploadMetadataToDynamoDB(metadata: ProductMetadata) {
    const putItemCommand = new PutCommand({
        TableName: tableName,
        Item: metadata,
    });

    await docClient.send(putItemCommand);
}

export async function uploadCategoryToDynamoDB(categories: ProductCategory[]) {
    for (const category of categories) {
        const putItemCommand = new PutCommand({
            TableName: tableName,
            Item: category,
        });

        await docClient.send(putItemCommand);
    }
}
