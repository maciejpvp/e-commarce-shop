import Joi from "joi";

type SchemaType = {
    code: string;
    discountType: "PERCENT" | "FLAT";
    discountValue: number; // % or USD
    expiryDate: number; // Unix timestamp
    isActive: boolean;
}

const createCouponSchema = Joi.object<SchemaType>({
    code: Joi.string().required(),
    discountType: Joi.string().valid("PERCENT", "FLAT").required(),
    discountValue: Joi.number().required(), // % or USD
    expiryDate: Joi.number().required(), // Unix timestamp
    isActive: Joi.boolean().required(),
});

export const validateCreateCouponSchema = (body: any): SchemaType => {
    const { error, value } = createCouponSchema.validate(body, {
        allowUnknown: false,
        abortEarly: true,
    });
    if (error) {
        throw error;
    }
    return value;
};