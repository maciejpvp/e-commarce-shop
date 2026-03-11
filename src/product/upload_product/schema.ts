import Joi from 'joi';
import { UploadProductEvent } from './types';

const schema = Joi.object<UploadProductEvent>({
    name: Joi.string().min(3).max(100).required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().min(10).max(1000).required(),
    stock: Joi.number().min(0).required(),
    categories: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
    media: Joi.array().items(Joi.object({
        type: Joi.string().valid("image/", "video/").required(),
        id: Joi.string().min(1).max(15).required(),
        isMain: Joi.boolean().required(),
    })).min(1).required(),
});

export function validateProductSchema(body: any): UploadProductEvent {
    const { error, value } = schema.validate(body);
    if (error) {
        throw error;
    }
    return value;
}
