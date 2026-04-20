import { TransactWriteCommand, TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const tableName = "test";
const commandInput: TransactWriteCommandInput = {
    TransactItems: [
        {
            Update: {
                TableName: tableName,
                Key: {
                    PK: `PRODUCT#123`,
                    SK: "METADATA",
                },
                UpdateExpression: "SET #gsi1pk = :gsi1pk, #gsi1sk = :gsi1sk",
                ExpressionAttributeNames: {
                    "#gsi1pk": "gsi1pk",
                    "#gsi1sk": "gsi1sk",
                },
                ExpressionAttributeValues: {
                    ":gsi1pk": `GROUP#abc`,
                    ":gsi1sk": `PRODUCT#123`,
                },
            }
        }
    ]
};
client.send(new TransactWriteCommand(commandInput));
