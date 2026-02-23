import Joi from "joi";

type SchemaType = {
    category: string,
}

const getProductsForCategorySchema = Joi.object<SchemaType>({
    category: Joi.string().trim().min(3).max(50).required(),
});

export const validateGetProductsForCategory = (params: any): SchemaType => {
    const { error, value } = getProductsForCategorySchema.validate(params, {
        allowUnknown: true,
    });

    if (error) {
        (error as any).isJoi = true;
        throw error;
    }
    return value;
}