import { validateGetProductsForCategory } from "./schema";
import { getProductDetails, getProductsByCategory } from "../services/product";

export const handler = async (event: any) => {
    try {
        const pathParameters = event.pathParameters || {};

        const validatedAttributes = validateGetProductsForCategory(pathParameters);
        const category = validatedAttributes.category;

        const products = await getProductsByCategory(category);

        const productIds = products.map((product) => product.PK.split("#")[1]);

        const productDetails = await Promise.all(
            productIds.map((productId) => getProductDetails(productId))
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ products: productDetails }),
        };
    } catch (error: any) {
        console.error('Error getting products:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};