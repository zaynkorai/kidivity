import { Image } from 'expo-image';

/**
 * Pre-fetches a list of activity images to the local device cache.
 * Useful for offline mode availability.
 */
export async function prefetchActivityImages(urls: (string | null | undefined)[]) {
    const validUrls = urls.filter((url): url is string => !!url && typeof url === 'string');
    
    if (validUrls.length === 0) return;

    try {
        // expo-image handles deduplication and caching internally
        await Image.prefetch(validUrls);
    } catch (error) {
        console.warn('[ImagePrefetch] Failed to prefetch some images:', error);
    }
}
