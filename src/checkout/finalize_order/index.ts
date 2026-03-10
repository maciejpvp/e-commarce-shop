import { updateOrderStatus } from "../../services/order";

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
    const { status, order } = event;

    const isSuccess = status === "SUCCESS";

    await updateOrderStatus(order, isSuccess ? "PAID" : "CANCELLED");

    const orderId = order.SK.split("#")[2];
    const userId = order.PK.split("#")[1];

    return {
        status,
        orderId,
        userId,
    };
};
