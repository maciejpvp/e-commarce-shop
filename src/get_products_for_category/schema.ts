import Joi from "joi";

type SchemaType = {
    category: string,
}

const getProductsForCategorySchema = Joi.object<SchemaType>({
    category: Joi.string().min(3).max(50).required(),
});

export const validateGetProductsForCategory = (body: any): SchemaType => {
    const { error, value } = getProductsForCategorySchema.validate(body, {
        allowUnknown: false,
    });
    if (error) {
        throw error;
    }
    return value;
}