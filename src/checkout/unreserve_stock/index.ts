import { fetchAllOrderItemsForUnreserve, unreserveStockTransaction } from "../../services/order";

export const handler = async (event: any) => {
    if (event.isSuccess) return;

    const { orderId } = event;
    if (!orderId) throw new Error("Missing orderId");

    await unReserveStock(orderId);

    return {
        message: "Stock unreserved successfully",
        orderId,
    };
};

async function unReserveStock(orderId: string) {
    const items = await fetchAllOrderItemsForUnreserve(orderId);

    const eligibleItems = items.filter((item) => !item.stockUnreserved);

    if (eligibleItems.length === 0) {
        console.log(
            `All items for Order ${orderId} are already unreserved or no items found.`
        );
        return;
    }

    await unreserveStockTransaction(eligibleItems, orderId);
}