import { getOrdersList } from "order-db";
import { withCors } from "../../utils/cors";

export const handler = async (event: any) => {
    try {
        const userId = event.requestContext.authorizer.sub;
        const nextToken = event.queryStringParameters?.nextToken;
        const limit = event.queryStringParameters?.limit || 10;

        if (limit > 50) {
        const response = {
            statusCode: 400,
            body: JSON.stringify({ message: "Limit is too high" }),
        };
        return withCors(response);
        }
        
        const { orders, nextToken: newNextToken } = await getOrdersList({ userId, nextToken, limit: Number(limit) })

        const list = orders.map((order) => {
            const { PK, SK, sessionId, sessionUrl, token, ...rest } = order;
            return {
                ...rest
            }
        })
        
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                orders: list,
                nextToken: newNextToken,
            }),
        };

        return withCors(response);
    } catch (err) {
        console.log("@@@@ ERROR: ", err);

        const response = {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };

        return withCors(response);
    }
}