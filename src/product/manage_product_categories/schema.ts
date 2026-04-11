import Joi from 'joi';

export type Mode = "add" | "delete";

type SchemaType = {
    productId: string,
    category: string,
    mode: Mode,
}

export const schema = Joi.object<SchemaType>({
    productId: Joi.string().uuid().required(),
    category: Joi.string().required(),
    mode: Joi.string().valid("add", "delete").required(),
});

export function validate(body: any): SchemaType {
    const { error, value } = schema.validate(body, {
        allowUnknown: false // Block unknown attributes
    });
    if (error) {
        throw error;
    }
    return value;
}

