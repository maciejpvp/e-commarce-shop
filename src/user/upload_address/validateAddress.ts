import Joi from "joi";

export type Address = {
    name: string;
    street: string;
    city: string;
    state: string;
    zip_code?: string;
    "zip-code"?: string;
    country: string;
}

const baseSchema = Joi.object<Address>({
    name: Joi.string()
        .trim()
        .replace(/[<>]/g, "")
        .min(2)
        .max(100)
        .required(),

    street: Joi.string().trim().min(5).max(100).required(),
    
    city: Joi.string()
        .pattern(/^[a-zA-Z\s.-]+$/) 
        .max(100)
        .required(),
    state: Joi.string().uppercase().min(2).max(50).required(),
    zip_code: Joi.string()
        .alphanum()
        .min(2)
        .max(10),
    "zip-code": Joi.string()
        .alphanum()
        .min(2)
        .max(10),
    country: Joi.string().uppercase().length(2).required(), 
}).unknown(false);

const fullSchema = baseSchema.or("zip_code", "zip-code");

export const validateAddress = (address: Address): Address => {
    const { error, value } = fullSchema.validate(address);
    if (error) {
        throw new Error(error.message);
    }
    return value;
}

export const validatePartialAddress = (address: Partial<Address>): Partial<Address> => {
    const partialSchema = baseSchema.fork(
        ["name", "street", "city", "state", "country", "zip_code", "zip-code"],
        (s) => s.optional()
    );

    const { error, value } = partialSchema.validate(address);
    if (error) {
        throw new Error(error.message);
    }
    return value;
}