import { createCoupon } from "../../services/coupon";
import { validateCreateCouponSchema } from "./schema";
import { withCors } from "../../utils/cors";

export const handler = async (event: any) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const validatedBody = validateCreateCouponSchema(body);

        await createCoupon(validatedBody);

        return withCors({
            statusCode: 200,
            body: JSON.stringify({ message: "Coupon created successfully" }),
        });
    } catch (error) {
        console.log("@@@@ ERROR: ", error);
        return withCors({
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request body" }),
        });
    }
};