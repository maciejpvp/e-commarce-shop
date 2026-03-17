import Joi from "joi";

type Address = {
    name: string;
    street: string;
    city: string;
    state: string;
    zip_code?: string;
    "zip-code"?: string;
    country: string;
}

const schema = Joi.object<Address>({
    name: Joi.string().min(2).max(100).required(),
    street: Joi.string().min(2).max(100).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    zip_code: Joi.string().min(2).max(10),
    "zip-code": Joi.string().min(2).max(10),
    country: Joi.string().min(2).max(100).required(),
}).or("zip_code", "zip-code").required();

export const validateAddress = (address: Address): Address => {
    const { error, value } = schema.validate(address);
    if (error) {
        throw new Error(error.message);
    }
    return value;
}