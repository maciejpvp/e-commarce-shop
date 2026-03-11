import { addToCart, getProductPriceForCart } from "../../services/cart";
import { validateAddToCartSchema } from "./schema";

export const handler = async (event: any) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const validatedBody = validateAddToCartSchema(body);

        const userId = event.requestContext.authorizer.sub;
        const productId = validatedBody.productId;
        const quantity = validatedBody.quantity;

        const priceAtAdd = await getProductPriceForCart(productId);

        await addToCart({
            userId,
            productId,
            quantity,
            priceAtAdd,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Product added to cart successfully" }),
        };
    } catch (error) {
        console.log("@@@@ ERROR: ", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request body" }),
        };
    }
};