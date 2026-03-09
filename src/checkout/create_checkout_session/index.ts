import Stripe from 'stripe';
import { getStripe } from '../../utils/getStripe';
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../utils/docClient';
import { OrderItem, OrderStatus, OrderSummary } from '../../dynamoDbTypes';
import { CartItem } from '../../types';

const tableName = process.env.TABLE_NAME;

let stripeInstance: Stripe | null = null;

type Event = {
    totalPrice: number;
    currency: string;
    token: string;
    originalData: {
        body: {
            cartItems: CartItem[]
            fullPrice: number
        }
    }
}

export const handler = async (event: Event) => {
    if (!stripeInstance) {
        stripeInstance = await getStripe();
    }
    console.log("event: ", event)
    const { totalPrice, token, originalData } = event;

    const orderId = uuidv4();

    const userId = "d3b4d862-40a1-70c1-e9d9-b92fa3708cb0";

    const createdAt = new Date().toISOString();

    const PK = `USER#${userId}`;
    const SK: OrderSummary['SK'] = `ORDER#${createdAt}#${orderId}`;

    try {
        const session = await createSession(totalPrice, PK, SK);

        const object: OrderSummary = {
            PK,
            SK,
            total_amount: totalPrice,
            currency: "usd",
            shipping_address: "Placeholder",
            status: OrderStatus.PENDING,
            orderId,
            sessionId: session.id,
            sessionUrl: session.url as string,
            token
        }

        await saveToDynamoDB(object);

        const orderItems: OrderItem[] = originalData.body.cartItems.map((item) => {
            return {
                PK: `ORDER#${orderId}`,
                SK: `ITEM#${item.productId}`,
                product_name: item.name,
                quantity: item.quantity,
                price_at_purchase: item.price,
                gsi1pk: `PRODUCT#${item.productId}`,
                gsi1sk: `ORDER#${createdAt}#${orderId}`,
            }
        })

        for (const orderItem of orderItems) {
            await saveOrderItemToDynamoDB(orderItem);
        }

        return {
            statusCode: 200,
            body: {
                sessionUrl: session.url,
                token,
            },
        };
    } catch (error: unknown) {
        console.error("@@@Error Occured!!!: ", error)

        throw new Error(JSON.stringify({
            message: error instanceof Error ? error.message : "Unknown error",
            cleanupData: {
                PK,
                SK,
                orderId
            }
        }))
    }
}

export const createSession = async (price: number, PK: string, SK: string) => {
    if (stripeInstance === null) {
        throw new Error("Stripe instance cannot be initialized correctly");
    }
    const session = await stripeInstance.checkout.sessions.create({
        mode: 'payment',
        success_url: 'https://example.com/success',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Your Product',
                    },
                    unit_amount: price,
                },
                quantity: 1,
            },
        ],
        metadata: {
            PK,
            SK
        }
    });

    return session;
}

const saveToDynamoDB = async (object: OrderSummary) => {
    const commandInput: PutCommandInput = {
        TableName: tableName,
        Item: object
    }

    const command = new PutCommand(commandInput);
    await docClient.send(command);
}

const saveOrderItemToDynamoDB = async (orderItem: OrderItem) => {
    const commandInput: PutCommandInput = {
        TableName: tableName,
        Item: orderItem
    }

    const command = new PutCommand(commandInput);
    await docClient.send(command);
}