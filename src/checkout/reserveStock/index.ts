import { CartItem } from "../../types";
import { reserveStockTransaction } from "../../services/order";

type EventProps = {
    statusCode: number;
    body: {
        cartItems: CartItem[];
        fullPrice: number;
        orderId: string;
    };
};

export const handler = async (event: EventProps) => {
    try {
        console.log("@@@@ EVENT: ", event);
        const products = event.body.cartItems;

        await reserveStockTransaction(products);
        return event;
    } catch (error) {
        console.log("@@@@ ERROR: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};