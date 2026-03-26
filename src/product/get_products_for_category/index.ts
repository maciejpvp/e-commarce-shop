import { validateGetProductsForCategory } from "./schema";
import { getProductItem, getProductsByCategory, transformProduct } from "../../services/product";
import { withCors } from "../../utils/cors";

export const handler = async (event: any) => {
    try {
        const pathParameters = event.pathParameters || {};

        const validatedAttributes = validateGetProductsForCategory(pathParameters);
        const category = validatedAttributes.category;

        const products = await getProducts(category);

        return withCors({
            statusCode: 200,
            body: JSON.stringify({ products }),
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

async function getProducts (category: string) {
    // Get PK and SK of each product in category
    const productsList = await getProductsByCategory(category);

    if (!productsList || !productsList.length) {
        return [];
    }

    // Get product details for each product
    const productIds = productsList.map((product) => product.PK.split("#")[1]);
    const products = await getProductItem(productIds);

    // Map products to frontend format
    const productsWithMappedCategories = products.map((product) => {
        // It wont be used in frontend, so we can optimalize it and put dummy category
        return transformProduct(product, [category]);
    });

    return productsWithMappedCategories;
}