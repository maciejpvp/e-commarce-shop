import { validateGetProductsForCategory } from "./schema";
import { getProductItem, getProductsByCategory } from "../../services/product";
import { withCors } from "../../utils/cors";

export const handler = async (event: any) => {
    try {
        const pathParameters = event.pathParameters || {};

        const validatedAttributes = validateGetProductsForCategory(pathParameters);
        const category = validatedAttributes.category;

        const products = await getProductsByCategory(category);

        const productIds = products.map((product) => product.PK.split("#")[1]);

        const productDetails = await getProductItem(productIds);

        return withCors({
            statusCode: 200,
            body: JSON.stringify({ products: productDetails }),
        });
    } catch (error: any) {
        console.error('Error getting products:', error);
        return withCors({
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        });
    }
};