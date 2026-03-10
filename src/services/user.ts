import { BatchGetCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/docClient";
import { Product, UserProfile } from "../dynamoDbTypes";

const TABLE_NAME = process.env.TABLE_NAME!;

// ─── User Profile ─────────────────────────────────────────────────────────────

export const fetchUserEmail = async (userId: string): Promise<string> => {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `USER#${userId}`,
            SK: "PROFILE",
        },
    });

    const response = await docClient.send(command);
    const userProfile = response.Item as UserProfile;
    if (!userProfile) {
        throw new Error("User not found");
    }

    return userProfile.email;
};

// ─── Product Batch Fetch ──────────────────────────────────────────────────────

export const getProductsByIds = async (
    productIds: string[]
): Promise<Product[]> => {
    const uniqueIds = [...new Set(productIds)];

    const keys = uniqueIds.map((id) => ({
        PK: `PRODUCT#${id}`,
        SK: "METADATA",
    }));

    const response = await docClient.send(
        new BatchGetCommand({
            RequestItems: {
                [TABLE_NAME]: { Keys: keys },
            },
        })
    );

    return (response.Responses?.[TABLE_NAME] || []) as Product[];
};
