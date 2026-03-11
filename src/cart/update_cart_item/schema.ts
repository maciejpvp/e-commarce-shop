import Joi from "joi";

type SchemaType = {
    productId: string;
    quantity: number;
}

const schema = Joi.object<SchemaType>({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().min(1).max(100).required(),
});

export function validateUpdateCartItemSchema(body: any): SchemaType {
    const { error, value } = schema.validate(body, {
        allowUnknown: false,
        abortEarly: true,
    });
    if (error) {
        throw error;
    }
    return value;
}

