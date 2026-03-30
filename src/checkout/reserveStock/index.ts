import { reserveStockTransaction } from "order-db";
import { UserAddress } from "../../dynamoDbTypes";
import { EnrichedCartItem } from "../validateCart";

type EventProps = {
    statusCode: number;
    body: {
        userId: string;
        orderId: string;
        address: UserAddress;
        couponCode?: string;
        cartItems: EnrichedCartItem[];
    };
};

export const handler = async (event: EventProps) => {
    try {
        console.log("@@@@ EVENT: ", event);
        const products = event.body.cartItems;

        await reserveStockTransaction(products);
        return {
            statusCode: 200,

            userId: event.body.userId,
            orderId: event.body.orderId,
            address: event.body.address,
            couponCode: event.body.couponCode,
            cartItems: event.body.cartItems,
        };
    } catch (error) {
        console.log("@@@@ ERROR: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};