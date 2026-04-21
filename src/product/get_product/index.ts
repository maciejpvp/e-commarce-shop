import { getProductCategories, getProductItem, getProductsByGroup, transformProduct } from "product-db";
import { Product } from "../../dynamoDbTypes";
import { withCors } from "../../utils/cors";
import * as Joi from "joi";

const schema = Joi.object({
    productId: Joi.string().required(),
});

export const validateGetProduct = (attributes: any) => {
    const { error, value } = schema.validate(attributes);
    if (error) {
        throw new Error(error.details[0].message);
    }
    return value;
};

export const handler = async (event: any) => {
    try {
        const validatedAttributes = validateGetProduct(event.pathParameters);
        const productId = validatedAttributes.productId;

        const product = (await getProductItem([productId])).at(0);
        if (!product) {
            throw new Error("Product not found");
        }
        const categories = await getProductCategories(productId);
        const group = product.gsi1pk?.split("#")[1] ?? undefined;
        const variants = group ? await getProductsByGroup(group) : [];

        const productWithMappedCategories = transformProduct(product, categories, variants as Product[]);

        return withCors({
            statusCode: 200,
            body: JSON.stringify({ product: productWithMappedCategories }),
        });
    } catch (error: any) {
        console.error('Error getting product:', error);
        return withCors({
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        });
    }
};