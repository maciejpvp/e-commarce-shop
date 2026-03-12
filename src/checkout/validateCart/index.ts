import { getCartItems } from "../../services/cart";
import { getProductItem } from "../../services/product";

export const handler = async ({ userId }: { userId: string }) => {
    try {
        const cartItems = await getCartItems(userId);

        if (!cartItems || cartItems.length === 0) {
            return {
                statusCode: 404,
                body: { message: "Cart empty" },
            };
        }

        const productIds = cartItems.map((item) => item.SK.split("#")[1]);

        const fullProducts = await getProductItem(productIds);

        const productMap = new Map(fullProducts.map((p) => [p?.PK, p]));

        const enrichedCartItems = [];
        let fullPrice = 0;

        for (const item of cartItems) {
            const productId = item.SK.split("#")[1];
            const product = productMap.get(`PRODUCT#${productId}`);

            if (!product) {
                return {
                    statusCode: 400,
                    body: { message: `Product ${productId} not found` },
                };
            }

            if (product.stock < item.quantity) {
                return {
                    statusCode: 400,
                    body: { message: `Insufficient stock for product ${product.name}` },
                };
            }

            enrichedCartItems.push({
                ...item,
                ...product,
                productId,
            });

            fullPrice += product.price * item.quantity;
        }

        return {
            statusCode: 200,
            body: {
                cartItems: enrichedCartItems,
                fullPrice,
                userId,
            },
        };
    } catch (error) {
        console.error("@@@@ ERROR: ", error);
        return {
            statusCode: 500,
            body: { message: "Internal server error" },
        };
    }
};