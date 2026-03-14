import { deleteCartItem, updateCartItem } from "../../services/cart";
import { validateUpdateCartItemSchema } from "./schema";
import { withCors } from "../../utils/cors";

export const handler = async (event: any) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const validatedBody = validateUpdateCartItemSchema(body);

        const userId = event.requestContext.authorizer.sub;
        const productId = validatedBody.productId;
        const quantity = validatedBody.quantity;

        console.log("@@@@ USER ID: ", userId);
        console.log("@@@@ PRODUCT ID: ", productId);
        console.log("@@@@ QUANTITY: ", quantity);

        if (quantity <= 0) {
            await deleteCartItem(userId, productId);
        } else {
            await updateCartItem(userId, productId, quantity);
        }

        return withCors({
            statusCode: 200,
            body: JSON.stringify({ message: "Cart item updated successfully" }),
        });
    } catch (error) {
        console.log("@@@@ ERROR: ", error);
        return withCors({
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request body" }),
        });
    }
};