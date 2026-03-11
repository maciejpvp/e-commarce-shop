import { v4 as uuidv4 } from 'uuid';
import { generatePresignedPost } from '../../utils/generatePresignedPOST';
import { MediaType, PresignedPostResponse } from './types';

const bucketName = process.env.BUCKET_NAME!;

export async function generatePresignedPostsForMedia(media: MediaType[], productId: string): Promise<PresignedPostResponse[]> {
    const presignedPosts: PresignedPostResponse[] = [];
    for (const mediaItem of media) {
        const key = `products/${productId}/raw/${uuidv4()}`;

        const presignedPost = await generatePresignedPost({
            bucket: bucketName,
            key,
            maxSizeBytes: 10 * 1024 * 1024, // 10MB
            expiresSeconds: 60 * 60 * 24, // 1 day
            contentType: mediaItem.type,
            metadata: {
                isMain: mediaItem.isMain.toString(),
            },
        });
        presignedPosts.push({
            uploadUrl: presignedPost.uploadUrl,
            fields: presignedPost.fields,
            key: presignedPost.key,
            type: mediaItem.type,
            isMain: mediaItem.isMain,
        });
    }
    return presignedPosts;
}
