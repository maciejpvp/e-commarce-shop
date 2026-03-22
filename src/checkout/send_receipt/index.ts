import { sendEmail } from "../../utils/sendEmail";
import { generateReceiptHTML } from "./generateReceipt";
import { getOrderSummary } from "../../services/order";
import { fetchUserEmail } from "../../services/user";
import { CheckoutSummary } from "../calculate-checkout-summary/types";

export const handler = async (event: any) => {
    const orderId = event.orderId;
    const userId = event.userId;

    const summary = await getOrderSummary(userId, orderId) as unknown as CheckoutSummary;
    const userEmail = await fetchUserEmail(userId);

    const html = generateReceiptHTML(summary);

    await sendEmail(userEmail, html, orderId);
};