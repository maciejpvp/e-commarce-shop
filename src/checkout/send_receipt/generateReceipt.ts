import { Product } from "../../dynamoDbTypes";

export const generateReceiptHTML = (products: Product[]): string => {
    const total = products.reduce((sum, item) => sum + item.price, 0);
    const date = new Date().toLocaleDateString();

    const productRows = products.map(product => {
        const mainImage = product.media.find(m => m.isMain)?.key || 'https://via.placeholder.com/60';

        return `
            <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #eeeeee;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td width="60" style="vertical-align: top;">
                                <img src="${mainImage}" alt="${product.name}" width="50" height="50" style="border-radius: 4px; display: block; object-fit: cover;">
                            </td>
                            <td style="padding-left: 15px;">
                                <p style="margin: 0; font-weight: bold; color: #333333;">${product.name}</p>
                                <p style="margin: 0; font-size: 12px; color: #777777;">1x</p>
                            </td>
                            <td align="right" style="vertical-align: top; font-weight: bold; color: #333333;">
                                $${product.price.toFixed(2)}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #e2e2e2;">
                        <tr>
                            <td style="padding-bottom: 20px; border-bottom: 2px solid #333333;">
                                <h1 style="margin: 0; font-size: 24px; color: #333333;">Order Receipt</h1>
                                <p style="margin: 5px 0 0; color: #888888; font-size: 14px;">Date: ${date}</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding-top: 10px;">
                                <table width="100%" cellspacing="0" cellpadding="0">
                                    ${productRows}
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding-top: 20px;">
                                <table width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="right" style="font-size: 18px; font-weight: bold; color: #333333;">
                                            Total: $${total.toFixed(2)}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding-top: 40px; font-size: 12px; color: #aaaaaa;">
                                <p>Thank you for your purchase!</p>
                                <p>If you have any questions, reply to this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};