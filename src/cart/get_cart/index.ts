import { getCart } from "../../services/cart";

export const handler = async (event: any) => {
    const userId = event.requestContext.authorizer.sub;

    const cart = await getCart(userId);

    return {
        statusCode: 200,
        body: JSON.stringify({ cart }),
    };
};
