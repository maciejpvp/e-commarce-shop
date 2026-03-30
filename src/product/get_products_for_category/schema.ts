import Joi from "joi";

type SchemaType = {
    category: string,
    limit?: number,
    nextToken?: string,
}

const getProductsForCategorySchema = Joi.object<SchemaType>({
    category: Joi.string().trim().min(3).max(50).required(),
    limit: Joi.number().integer().min(1).max(20).optional(),
    nextToken: Joi.string().optional(),
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