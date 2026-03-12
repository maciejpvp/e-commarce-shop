import { getProductCategories, getProductItem } from "../../services/product";
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

const unslugify = (slug: string) => {
    return slug
        .replace(/-/g, ' ') 
        .replace(/\b\w/g, (char) => char.toUpperCase()); 
};

export const handler = async (event: any) => {
    try {
        const validatedAttributes = validateGetProduct(event.pathParameters);
        const productId = validatedAttributes.productId;

        const product = (await getProductItem([productId]))[0];
        const categories = await getProductCategories(productId);

        console.log(categories);

        const productWithMappedCategories = {
            ...product,
            categories: categories.map((category: any) => {
                const slug = category.SK.split("#")[1];
                return { name: unslugify(slug), slug };
            }),
        };

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