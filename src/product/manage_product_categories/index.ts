import { APIGatewayEvent } from "aws-lambda";
import { Mode, validate } from "./schema";
import { addCategoryToProduct, removeCategoryFromProduct } from "product-db";
import { withCors } from "src/utils/cors";

/**
 * Product Category Handler
 * Expects:
 * 1. URL: products/{productId}/categories
 * 2. BODY: { "category": "...", "mode": "add" | "delete" } (as JSON)
 * Example: POST to /products/123/categories with {"category": "tech", "mode": "add"}
 */
export const handler = async (event: APIGatewayEvent) => {
    try {
        const { productId, category, mode } = extractRequestedData(event);

        const mapMode: Record<Mode, (props: { productId: string, category: string }) => Promise<void>> = {
            add: addCategoryToProduct,
            delete: removeCategoryFromProduct,
        }

        await mapMode[mode]?.({ productId, category });

        const response = withCors({
            statusCode: 200,
            body: JSON.stringify({ message: "Category managed successfully" }),
        });

        return response;

    } catch (error) {
        console.log(`!!!ERROR: ${error}`);
        const response = withCors({
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error." }),
        });

        return response;
    }
}

function extractRequestedData(event: APIGatewayEvent) {
    const productId = event.pathParameters?.productId;
    const body = JSON.parse(event.body || '{}');
    const category = body.category;
    const mode = body.mode;

    const validatedData = validate({ productId, category, mode });

    return validatedData;
}
