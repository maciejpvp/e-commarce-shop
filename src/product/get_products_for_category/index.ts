import { validateGetProductsForCategory } from "./schema";
import { getProductItem, getProductsByCategory, transformProduct } from "../../services/product";
import { withCors } from "../../utils/cors";

export const handler = async (event: any) => {
    try {
        const pathParameters = event.pathParameters || {};
        const queryParameters = event.queryStringParameters || {};

        const validatedAttributes = validateGetProductsForCategory({ ...pathParameters, ...queryParameters });
        const { category, limit, nextToken } = validatedAttributes;

        const result = await getProducts({ category, limit: Number(limit ?? 10), nextToken });

        return withCors({
            statusCode: 200,
            body: JSON.stringify(result),
        });
    } catch (error: any) {
        console.error('Error getting products:', error);
        return withCors({
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        });
    }
};

// Helpers

async function getProducts ({ category, limit, nextToken }: { category: string, limit: number, nextToken?: string }) {
    // Get PK and SK of each product in category
    const { products: productsList, nextToken: newNextToken } = await getProductsByCategory({ category, limit, nextToken });

    if (!productsList || !productsList.length) {
        return { products: [], nextToken: undefined };
    }

    // Get product details for each product
    const productIds = productsList.map((product) => product.PK.split("#")[1]);
    const products = await getProductItem(productIds);

    // Map products to frontend format
    const productsWithMappedCategories = products.map((product) => {
        // It wont be used in frontend, so we can optimalize it and put dummy category
        return transformProduct(product, [category]);
    });

    return { products: productsWithMappedCategories, nextToken: newNextToken };
}