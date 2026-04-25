import Joi from 'joi';

type SchemaType = {
    version: number,
    data: {
        name?: string;
        description?: string;
        price?: number;
        stock?: number;
        tech_spec?: string;
        attributes?: string;
    }
}

export const updateProductSchema = Joi.object<SchemaType>({
    version: Joi.number().required(),
    data: Joi.object({
        name: Joi.string().min(3).max(100),
        price: Joi.number().min(0),
        description: Joi.string().min(10).max(1000),
        stock: Joi.number().min(0),
        tech_spec: Joi.string(),
        attributes: Joi.string(),
    }).min(1)
});

export function validateUpdateProduct(body: any): SchemaType {
    const { error, value } = updateProductSchema.validate(body, {
        allowUnknown: false // Block unknown attributes
    });
    if (error) {
        throw error;
    }
    return value;
}
