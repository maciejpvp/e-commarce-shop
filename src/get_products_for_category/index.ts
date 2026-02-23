import { getProductDetails, getProductsByCategory } from "./db";
import { validateGetProductsForCategory } from "./schema";

export const handler = async (event: any) => {
    console.log(event);

    const body = event.body ? JSON.parse(event.body) : {};
    const validatedAttributes = validateGetProductsForCategory(body);
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
};