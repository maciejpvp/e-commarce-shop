import Joi from 'joi';

type SchemaType = {
    userId: string,
    orderId: string,
}

export const schema = Joi.object<SchemaType>({
    userId: Joi.string().uuid().required(),
    orderId: Joi.string().uuid().required(),
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
