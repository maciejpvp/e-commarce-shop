import { CheckoutSummary } from "../calculate-checkout-summary/types";
import ReceiptTemplate from "../../../mail-templates/receipt-email/src/ReceiptTemplate";
import { renderToStaticMarkup } from 'react-dom/server';

export const generateReceiptHTML = (summary: CheckoutSummary): string => {
    const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const html = renderToStaticMarkup(
        <ReceiptTemplate
            summary={summary}
            date={date}
        />
    );

    return html;
};