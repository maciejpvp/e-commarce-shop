import { APIGatewayProxyEvent } from "aws-lambda";
import { withCors } from "../../utils/cors";
import { getCart } from "cart-db";
import { getProductCategories, getProductItem } from "product-db";
import { calculateSummary } from "./calculateSummary";
import {
    ApiGatewayBody,
    CalculateCheckoutProps,
    CartItemInput,
    CheckoutSummary,
    StepFunctionEvent,
} from "./types";
import { UserCart, Product } from "../../dynamoDbTypes";

// ─── Auth ──────────────────────────────────────────────────────────────────────

function extractUserId(event: APIGatewayProxyEvent): string {
    const userId = event.requestContext.authorizer?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");
    return userId;
}

// ─── Request parsing ───────────────────────────────────────────────────────────

function parseBody(event: APIGatewayProxyEvent): ApiGatewayBody {
    if (!event.body) return {};
    try {
        return JSON.parse(event.body) as ApiGatewayBody;
    } catch {
        throw new HttpError(400, "Invalid JSON body");
    }
}

// ─── DynamoDB fetching (API Gateway path only) ─────────────────────────────────

async function fetchEnrichedCartItems(userId: string): Promise<CartItemInput[]> {
    const cartRows = await getCart(userId);

    console.log("CART ROWS:", cartRows);

    if (!cartRows || cartRows.length === 0) {
        throw new HttpError(400, "Cart is empty");
    }

    const productIds = cartRows.map((row: UserCart) => row.SK.split("#")[1]);
    const products = await getProductItem(productIds);
    const productMap = new Map<string, Product>(products.map((p) => [p.PK, p]));

    return Promise.all(cartRows.map(async (row: UserCart): Promise<CartItemInput> => {
        const productId = row.SK.split("#")[1];
        const product = productMap.get(`PRODUCT#${productId}`);
        if (!product) throw new HttpError(400, `Product ${productId} not found`);

        return {
            productId,
            name: product.name,
            categories: await getProductCategories(productId),
            price: product.price,
            quantity: row.quantity,
            media: product.media,
        };
    }));
}

// ─── Props builders ────────────────────────────────────────────────────────────

async function buildPropsFromApiGateway(event: APIGatewayProxyEvent): Promise<CalculateCheckoutProps> {
    const userId = extractUserId(event);
    const { couponCode } = parseBody(event);
    const cartItems = await fetchEnrichedCartItems(userId);

    return {
        userId,
        orderId: "", // not relevant for preview — summary is stateless
        cartItems,
        couponCode,
    };
}

function buildPropsFromStepFunction(event: StepFunctionEvent): CalculateCheckoutProps {
    if (!event.cartItems || event.cartItems.length === 0) {
        throw new Error("cartItems are required and must not be empty");
    }
    return {
        userId: event.userId,
        orderId: event.orderId,
        address: event.address,
        couponCode: event.couponCode,
        cartItems: event.cartItems,
    };
}

// ─── Response formatters ───────────────────────────────────────────────────────

function apiGatewaySuccess(summary: CheckoutSummary) {
    return withCors({
        statusCode: 200,
        body: JSON.stringify(summary),
    });
}

function apiGatewayError(error: unknown) {
    if (error instanceof HttpError) {
        return withCors({
            statusCode: error.statusCode,
            body: JSON.stringify({ message: error.message }),
        });
    }
    console.error("Unhandled error:", error);
    return withCors({
        statusCode: 500,
        body: JSON.stringify({ message: "Internal server error" }),
    });
}

function stepFunctionSuccess(summary: CheckoutSummary) {
    return { statusCode: 200, body: summary };
}

// ─── Error class ───────────────────────────────────────────────────────────────

class HttpError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string
    ) {
        super(message);
        this.name = "HttpError";
    }
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export const handler = async (event: APIGatewayProxyEvent | StepFunctionEvent) => {
    console.log("EVENT:", JSON.stringify(event));

    const isApiGateway = "httpMethod" in event;

    if (isApiGateway) {
        try {
            const props = await buildPropsFromApiGateway(event as APIGatewayProxyEvent);
            console.log("PROPS:", props);
            const summary = calculateSummary(props);
            return apiGatewaySuccess(summary);
        } catch (error) {
            return apiGatewayError(error);
        }
    }

    // Step Function path — let errors propagate so the workflow can catch them
    const props = buildPropsFromStepFunction(event as StepFunctionEvent);
    const summary = calculateSummary(props);
    if (isApiGateway) {
        return stepFunctionSuccess(summary);
    } else {
        return {
            ...event,
            summary,
        }
    }
};
