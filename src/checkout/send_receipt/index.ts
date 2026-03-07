import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/docClient";
import { OrderItem, Product, UserProfile } from "../../dynamoDbTypes";
import { generateReceiptHTML } from "./generateReceipt";
import { sendEmail } from "../../utils/sendEmail";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
    const orderId = event.orderId;
    const userId = event.userId;

    console.log("Order ID:", orderId);
    console.log("User ID:", userId);

    const items = await getOrderItems(orderId);
    const productIds = items.map(item => item.SK.split("#")[1]);
    console.log("Product IDs:", productIds);
    const products = await getProducts(productIds);

    if (products.length > 0) {
        const htmlBody = generateReceiptHTML(products);
        const email = await fetchUserEmail(userId);
        await sendEmail(email, htmlBody);
    }

    console.log("Products:", products);

}

const getOrderItems = async (orderId: string) => {
    const items: OrderItem[] = [];
    let lastEvaluatedKey: any = undefined;

    // Use a loop to handle pagination if an order has many items
    do {
        const response = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `ORDER#${orderId}`,
                ":sk": "ITEM#"
            },
            ExclusiveStartKey: lastEvaluatedKey
        }));

        if (response.Items) items.push(...(response.Items as OrderItem[]));
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log("Items:", items);

    return items;
};

const getProducts = async (productIds: string[]) => {
    const uniqueIds = [...new Set(productIds)];

    const keys = uniqueIds.map(id => ({
        PK: `PRODUCT#${id}`,
        SK: "METADATA"
    }));
    const response = await docClient.send(new BatchGetCommand({
        RequestItems: {
            [TABLE_NAME]: {
                Keys: keys
            }
        }
    }));

    const products = (response.Responses?.[TABLE_NAME] || []) as Product[];

    console.log("Products:", products);

    return products;
};

const fetchUserEmail = async (userId: string): Promise<string> => {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `USER#${userId}`,
            SK: "PROFILE"
        }
    });

    const response = await docClient.send(command);
    const userProfile = response.Item as UserProfile;
    if (!userProfile) {
        throw new Error("User not found");
    }
    const email = userProfile.email;

    return email;
}