import Stripe from "stripe";
import { getSessionId, updateOrderStatus } from "../../services/order";
import { getStripe } from "../../utils/getStripe";

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

    await updateOrderStatus(order, isSuccess ? "PAID" : "CANCELLED");
    
    const orderId = order.SK.split("#")[1];
    const userId = order.PK.split("#")[1];
    
    const sessionId = await getSessionId(order.PK, order.SK);
    console.log(`@@@ Session ID: ${sessionId}`);

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