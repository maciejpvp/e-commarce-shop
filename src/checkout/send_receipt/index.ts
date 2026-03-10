import { OrderItem } from "../../dynamoDbTypes";
import { sendEmail } from "../../utils/sendEmail";
import { generateReceiptHTML } from "./generateReceipt";
import { getOrderItemsTyped } from "../../services/order";
import { getProductsByIds } from "../../services/user";
import { fetchUserEmail } from "../../services/user";

export const handler = async (event: any) => {
    const orderId = event.orderId;
    const userId = event.userId;

    const items: OrderItem[] = await getOrderItemsTyped(orderId);
    const productIds = items.map((item) => item.SK.split("#")[1]);
    const products = await getProductsByIds(productIds);

    if (products.length > 0) {
        console.log({ items, products, orderId, userId });
        const htmlBody = generateReceiptHTML(items, products, orderId);
        const email = await fetchUserEmail(userId);
        await sendEmail(email, htmlBody);
    }

    console.log("Products:", products);
};