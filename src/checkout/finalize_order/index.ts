import Stripe from "stripe";
import { getSessionId, updateOrderStatus } from "../../services/order";
import { getStripe } from "../../utils/getStripe";
import { emptyCart, getCartItems } from "../../services/cart";

let stripeInstance: Stripe | null = null;

type Order = {
    PK: string;
    SK: string;
};

type EventType = {
    status: "SUCCESS" | "FAILED";
    processedAt: string;
    order: Order;
};

export const handler = async (event: EventType) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    const { status, order } = event;

    const isSuccess = status === "SUCCESS";
    const orderId = order.SK.split("#")[1];
    const userId = order.PK.split("#")[1];

    await updateOrderStatus({ 
        order, 
        status: isSuccess ? "PAID" : "CANCELLED",
        attributesToRemove: ["sessionUrl", "sessionId", "token"]
    });

    // Empty cart if order was successful
    if (isSuccess) {
        const cartItems = await getCartItems(userId);
        await emptyCart(cartItems);
    }
    
    const sessionId = await getSessionId(order.PK, order.SK);

    // If order failed, expire session to prevent user from paying for the order
    if (!isSuccess) {
        await expireSession(sessionId);
    }

    return {
        status,
        orderId,
        userId,
    };
};

export const expireSession = async (sessionId: string) => {
    if (stripeInstance === null) {
        stripeInstance = await getStripe(); 
    }

    if (!stripeInstance) {
        throw new Error("Stripe instance cannot be initialized correctly");
    }

    try {
        const session = await stripeInstance.checkout.sessions.expire(sessionId);
        console.log(`@@@ Session expired successfully: ${sessionId}`);
        return session;
    } catch (error: any) {
        console.error(`@@@ Failed to expire session ${sessionId}:`, error.message);
        return null;
    }
};