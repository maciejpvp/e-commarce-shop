import Joi from 'joi';

type SchemaType = {
    version: number,
    name?: string,
    price?: number,
    description?: string,
    stock?: number,
    media?: {
        uploadUrl: string,
        fields: string,
        key: string,
        type: string,
        isMain: boolean,
    }[],
}

export const updateProductSchema = Joi.object<SchemaType>({
    version: Joi.number().required(),
    name: Joi.string().min(3).max(100),
    price: Joi.number().min(0),
    description: Joi.string().min(10).max(1000),
    stock: Joi.number().min(0),
    media: Joi.array().items(Joi.object({
        uploadUrl: Joi.string().uri().required(),
        fields: Joi.string().required(),
        key: Joi.string().required(),
        type: Joi.string().valid("image/", "video/").required(),
        isMain: Joi.boolean().required(),
    })),
}).min(1); // At least one attribute must be provided

export function validateUpdateProduct(body: any): SchemaType {
    const { error, value } = updateProductSchema.validate(body, {
        allowUnknown: false // Block unknown attributes
    });
    if (error) {
        throw error;
    }
    return value;
}
