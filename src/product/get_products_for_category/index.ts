import { validateGetProductsForCategory } from "./schema";
import { getProductCategories, getProductItem, getProductsByCategory, transformProduct } from "product-db";
import { Product } from "../../dynamoDbTypes";
import { withCors } from "../../utils/cors";

export const handler = async (event: any) => {
    try {
        const pathParameters = event.pathParameters || {};
        const queryParameters = event.queryStringParameters || {};

        const validatedAttributes = validateGetProductsForCategory({ ...pathParameters, ...queryParameters });
        const { category, limit, nextToken, populateCategories } = validatedAttributes;

        const result = await getProducts({ category, limit: Number(limit ?? 10), nextToken, populateCategories });

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

type GetProductsProps = {
    category: string,
    limit: number,
    nextToken?: string,
    populateCategories?: boolean,
}

async function getProducts ({ category, limit, nextToken, populateCategories }: GetProductsProps) {
    // Get PK and SK of each product in category
    const { products: productsList, nextToken: newNextToken } = await getProductsByCategory({ category, limit, nextToken });

    if (!productsList || !productsList.length) {
        return { products: [], nextToken: undefined };
    }

    // Get product details for each product
    const productIds = productsList.map((product) => product.PK.split("#")[1]);
    const products = await getProductItem(productIds);

    // Map products to frontend format
    const productsWithMappedCategories = await Promise.all(products.map(async (product) => {
        if (populateCategories) {
            const categories = await getProductCategories(product.PK!.split("#")[1]);
            console.log(`categories`, categories);

            return transformProduct(product as Product, categories);
        }
        
        // It wont be used in frontend, so we can optimalize it and put dummy category
        return transformProduct(product as Product, [category]);
    }));

    return { products: productsWithMappedCategories, nextToken: newNextToken };
}