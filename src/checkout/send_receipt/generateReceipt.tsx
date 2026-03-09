import { OrderItem, Product } from "../../dynamoDbTypes";
import ReceiptTemplate from "../../../mail-templates/receipt-email/src/ReceiptTemplate";
import { renderToStaticMarkup } from 'react-dom/server';
import { ReceiptItem } from "../../../mail-templates/receipt-email/src/types";

export const generateReceiptHTML = (orderItems: OrderItem[], products: Product[], orderId: string): string => {
    const receiptItems: ReceiptItem[] = orderItems.map(item => {
        const productId = item.SK.split("#")[1];
        const product = products.find(p => p.PK === `PRODUCT#${productId}`);
        if (!product) {
            throw new Error(`Product ${productId} not found`);
        }
        return {
            details: product as any, // Cast because of minor type differences if any, or just to satisfy the compiler
            quantity: item.quantity
        };
    });

    const date = new Date().toLocaleDateString();

    const html = renderToStaticMarkup(
        <ReceiptTemplate
            items={receiptItems}
            orderNumber={orderId}
            date={date}
        />
    );

    console.log(`HTML: ${html}`);

    return html;
};