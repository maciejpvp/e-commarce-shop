import { APIGatewayEvent } from "aws-lambda";
import Joi from "joi";
import { addGroupToProducts, removeGroupFromProducts } from "product-db";
import { withCors } from "src/utils/cors";

type BodyType = {
    productIds: string[];
    group?: string;
}

export const handler = async (event: APIGatewayEvent) => {
    const method = event.httpMethod;
    try {
        const data = extractRequestedData(event, method);

        const isSuccess = method === "POST"
            ? await addGroupToProducts(data as { productIds: string[]; group: string })
            : method === "DELETE" ? await removeGroupFromProducts(data.productIds) : false;

        if (!isSuccess) throw new Error("Failed to add products to group");

        return withCors({
            statusCode: method === "POST" ? 201 : 200,
            body: JSON.stringify({
                message: method === "POST" ? "Products added to group successfully" : "Products removed from group successfully",
            })
        })
    } catch (error: any) {
        console.error(`Failed to manage products group: ${error}`);

        if (error instanceof SyntaxError) {
            return withCors({
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid JSON payload format. Please ensure valid JSON.",
                })
            });
        }

        if (error.isJoi) {
            return withCors({
                statusCode: 400,
                body: JSON.stringify({
                    message: "Validation Error",
                    details: error.details,
                })
            });
        }

        return withCors({
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal Server Error",
            })
        })
    }
}

function extractRequestedData(event: APIGatewayEvent, method: string) {
    return validate(JSON.parse(event.body || "{}"), method);
}

const schema = Joi.object<BodyType>({
    productIds: Joi.array().items(Joi.string().uuid().required()).required(),
    group: Joi.string().when("$method", {
        is: "POST",
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
});

const validate = (data: any, method: string): BodyType => {
    const { error, value } = schema.validate(data, {
        allowUnknown: false,
        context: { method },
    });
    if (error) {
        throw error;
    }
    return value;
}