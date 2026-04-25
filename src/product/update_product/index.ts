import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { validateUpdateProduct } from './schema';
import { buildDynamicUpdateExpression } from './builder';
import { updateProduct } from "product-db";
import { withCors } from '../../utils/cors';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const productId = event.pathParameters?.productId;
        if (!productId) {
            return withCors({
                statusCode: 400,
                body: JSON.stringify({ message: "Product ID is required" }),
            });
        }

        const body = event.body ? JSON.parse(event.body) : {};
        const { data, version } = validateUpdateProduct(body);

        const {
            updateExpression,
            expressionAttributeNames,
            expressionAttributeValues,
            conditionExpression,
        } = buildDynamicUpdateExpression(data, version);

        console.log(`Updating product ${productId} with expression: ${updateExpression}`);

        const updatedAttributes = await updateProduct({
            productId,
            updateExpression,
            expressionAttributeNames,
            expressionAttributeValues,
            conditionExpression,
        });

        return withCors({
            statusCode: 200,
            body: JSON.stringify({
                message: "Product updated successfully",
                updatedAttributes,
            }),
        });

    } catch (error: any) {
        console.error('Error updating product:', error);

        if (error.isJoi) {
            return withCors({
                statusCode: 400,
                body: JSON.stringify({
                    message: "Validation error",
                    details: error.details.map((d: any) => d.message)
                }),
            });
        }

        if (error.name === 'ConditionalCheckFailedException') {
            return withCors({
                statusCode: 404,
                body: JSON.stringify({ message: "Product not found" }),
            });
        }

        return withCors({
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        });
    }
};