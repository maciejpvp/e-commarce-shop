import { validateUpdateCartItemSchema } from "./schema";
import { updateCartItem } from "./updateCartItem";

export const handler = async (event: any) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const validatedBody = validateUpdateCartItemSchema(body);

        const userId = event.requestContext.authorizer.sub;
        const productId = validatedBody.productId;
        const quantity = validatedBody.quantity;

        await updateCartItem(userId, productId, quantity);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Cart item updated successfully" }),
        };
    } catch (error) {
        console.log("@@@@ ERROR: ", error)
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request body" }),
        };
    }
}