import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

import type { FastifyBaseLogger } from 'fastify';

// Ensure the environment variables exist
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
export const publicUrl = process.env.R2_PUBLIC_URL;

let s3Client: S3Client | null = null;

if (accountId && accessKeyId && secretAccessKey) {
    s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
}

/**
 * Uploads a base64 encoded image to Cloudflare R2 and returns the public URL.
 * Base64 string can optionally include the data URI prefix (e.g., "data:image/png;base64,...").
 */
export async function uploadBase64Image(base64Data: string, logger: FastifyBaseLogger): Promise<string | null> {
    if (!s3Client || !bucketName || !publicUrl) {
        logger.warn('R2 credentials missing. Skipping image upload.');
        return null;
    }

    try {
        // Extract the mime type and raw base64 data using regex
        const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        
        let mimeType = 'image/png';
        let pureBase64 = base64Data;

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            pureBase64 = matches[2];
        }

        // Convert base64 to a Buffer
        const buffer = Buffer.from(pureBase64, 'base64');
        
        // Generate a random filename with correct extension
        const extension = mimeType.split('/')[1] || 'png';
        const filename = `${randomUUID()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: buffer,
            ContentType: mimeType,
            CacheControl: 'public, max-age=31536000, immutable',
            // R2 doesn't always need ACLs, public access is managed at bucket level
        });

        await s3Client.send(command);

        // Return the full public URL for the image
        const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        return `${cleanPublicUrl}/${filename}`;
    } catch (error) {
        logger.error({ err: error }, 'Failed to upload image to R2');
        return null;
    }
}
