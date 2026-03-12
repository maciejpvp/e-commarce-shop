import { Product } from "../../dynamoDbTypes";
import { getCart } from "../../services/cart";
import { getProductItem } from "../../services/product";
import { withCors } from "../../utils/cors";

type CartItem = {
    item: Product;
    quantity: number;
}

export const handler = async (event: any) => {
    const userId = event.requestContext.authorizer.sub;

    const cart = await getCart(userId);

    if (!cart || cart.length === 0) {
        return withCors({
            statusCode: 200,
            body: JSON.stringify({ cart: [], products: [] }),
        });
    }

    const productIds = cart.map((item) => item.SK.split("#")[1]);
    const products: Product[] = await getProductItem(productIds);

    if (products.length !== productIds.length) {
        return withCors({
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        });
    }

    const cartItems: CartItem[] = cart.map((item) => {
        const id = item.SK.split("#")[1];
        const product = products.find((p) => p.PK === `PRODUCT#${id}`);

        if (!product) {
            return null;
        }

        return {
            item: product,
            quantity: item.quantity,
        };
    }).filter((item) => item !== null);

    return withCors({
        statusCode: 200,
        body: JSON.stringify({ cartItems }),
    });
};
