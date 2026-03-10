import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { validateUpdateProduct } from './schema';
import { buildDynamicUpdateExpression } from './builder';
import { updateProduct } from '../services/product';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const productId = event.pathParameters?.productId;
        if (!productId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Product ID is required" }),
            };
        }

        const body = event.body ? JSON.parse(event.body) : {};
        const validatedAttributes = validateUpdateProduct(body);

        const {
            updateExpression,
            expressionAttributeNames,
            expressionAttributeValues,
            conditionExpression,
        } = buildDynamicUpdateExpression(validatedAttributes, validatedAttributes.version);

        console.log(`Updating product ${productId} with expression: ${updateExpression}`);

        const updatedAttributes = await updateProduct({
            productId,
            updateExpression,
            expressionAttributeNames,
            expressionAttributeValues,
            conditionExpression,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Product updated successfully",
                updatedAttributes,
            }),
        };

    } catch (error: any) {
        console.error('Error updating product:', error);

        if (error.isJoi) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Validation error",
                    details: error.details.map((d: any) => d.message)
                }),
            };
        }

        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Product not found" }),
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};