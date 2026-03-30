import Stripe from 'stripe';
import { getStripe } from '../../utils/getStripe';
import { saveOrderSummary, saveOrderItem } from 'order-db';
import { OrderItem, OrderStatus, OrderSummary, UserAddress } from '../../dynamoDbTypes';
import { EnrichedCartItem } from '../validateCart';
import { CheckoutSummary } from '../calculate-checkout-summary/types';

let stripeInstance: Stripe | null = null;

type Event = {
    token: string;
    input: {
        userId: string;
        orderId: string;
        address: UserAddress;
        cartItems: EnrichedCartItem[];
        summary: CheckoutSummary;
    };
};

export const handler = async (event: Event) => {
    if (!stripeInstance) {
        stripeInstance = await getStripe();
    }

    console.log("EVENT:", JSON.stringify(event));

    const { token, input } = event;

    console.log("INPUT:", input);

    const { userId, orderId, address, summary, cartItems } = input;

    const totalPrice = summary.totalAmount;

    const PK = `USER#${userId}` as OrderSummary['PK'];
    const SK: OrderSummary['SK'] = `ORDER#${orderId}`;

    try {
        const session = await createSession(totalPrice, PK, SK);

        const object: OrderSummary = {
            PK,
            SK,
            total_amount: totalPrice,
            currency: "usd",
            shipping_address: JSON.stringify(address),
            status: OrderStatus.PENDING,
            orderId,
            summary: JSON.stringify(summary),
            createdAt: new Date().toISOString(),
            sessionId: session.id,
            sessionUrl: session.url as string,
            token,
        };

        await saveOrderSummary(object);

        const orderItems: OrderItem[] = cartItems.map((item) => ({
            PK: `ORDER#${orderId}`,
            SK: `ITEM#${item.productId}`,
            product_name: item.name,
            quantity: item.quantity,
            price_at_purchase: item.price,
            gsi1pk: `PRODUCT#${item.productId}`,
            gsi1sk: `ORDER#${orderId}`,
        }));

        for (const orderItem of orderItems) {
            await saveOrderItem(orderItem);
        }

        return {
            statusCode: 200,
            body: {
                sessionUrl: session.url,
                token,
            },
        };
    } catch (error: unknown) {
        console.error("@@@Error Occured!!!: ", error);

        throw new Error(JSON.stringify({
            message: error instanceof Error ? error.message : "Unknown error",
            cleanupData: { PK, SK, orderId },
        }));
    }
};

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
                    product_data: { name: 'Your Product' },
                    unit_amount: price,
                },
                quantity: 1,
            },
        ],
        metadata: { PK, SK },
    });

    return session;
};