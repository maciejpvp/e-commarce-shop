import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { validateProductSchema } from './schema';
import { generatePresignedPostsForMedia } from './media';
import { uploadProductMetadata, uploadProductCategory } from '../services/product';
import { ProductCategory, ProductMetadata } from '../types';

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const validatedBody = validateProductSchema(body);

        const productId = uuidv4();

        const presignedPosts = await generatePresignedPostsForMedia(validatedBody.media, productId);

        const productMetadata: ProductMetadata = {
            PK: `PRODUCT#${productId}`,
            SK: 'METADATA',
            name: validatedBody.name,
            description: validatedBody.description,
            price: validatedBody.price,
            stock: validatedBody.stock,
            media: presignedPosts.map((post) => ({
                type: post.type,
                key: post.key,
                isMain: post.isMain,
            })),
            created_at: Date.now(),
            version: 1,
        };

        const productCategories: ProductCategory[] = validatedBody.categories.map((category) => ({
            PK: `PRODUCT#${productId}`,
            SK: `CATEGORY#${category}`,
            gsi1pk: `CATEGORY#${category}`,
            gsi1sk: `PRICE#${validatedBody.price}#${productId}`,
        }));

        await uploadProductMetadata(productMetadata);
        await uploadProductCategory(productCategories);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Product uploaded successfully",
                presignedPosts,
            }),
        };
    } catch (error: any) {
        console.error('Error processing product upload:', error);

        if (error.isJoi) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Validation error", details: error.details }),
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};