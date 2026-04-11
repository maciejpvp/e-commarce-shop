import { APIGatewayEvent } from "aws-lambda";
import { Mode, validate } from "./schema";
import { addCategoryToProduct, removeCategoryFromProduct } from "product-db";
import { withCors } from "src/utils/cors";

export const handler = (event: APIGatewayEvent) => {
try {
   const {productId, category, mode} = extractRequestedData(event);

    const mapMode: Record<Mode, (props: {productId: string, category: string}) => void> = {
        add: addCategoryToProduct,
        delete: removeCategoryFromProduct,
    }

    mapMode[mode]?.({productId, category});

   const response = withCors({
    statusCode: 200,
    body: JSON.stringify({ message: "Category managed successfully" }),
   });

   return response;

} catch (error) {
    console.error(error);
    const response = withCors({
        statusCode: 500,
        body: JSON.stringify({ message: "Internal server error" }),
    });

    return response;
}
}

function extractRequestedData(event: APIGatewayEvent) {
    const productId = event.pathParameters?.productId;
    const body = JSON.parse(event.body || '{}');
    const category = body.category;
    const mode = body.mode;

    const validatedData = validate({productId, category, mode});

    return validatedData;
}
