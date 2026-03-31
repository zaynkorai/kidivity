import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1']);

function getDevServerHost(): string | null {
    const hostUri =
        Constants.expoConfig?.hostUri ??
        Constants.manifest2?.extra?.expoClient?.hostUri ??
        Constants.manifest?.hostUri ??
        null;

    if (!hostUri) return null;
    const host = hostUri.split(':')[0];
    return host || null;
}

export function resolveLocalhostUrl(rawUrl: string): string {
    if (!rawUrl) return rawUrl;
    if (Platform.OS === 'web') return rawUrl;

    try {
        const parsed = new URL(rawUrl);
        if (!LOCALHOST_HOSTS.has(parsed.hostname)) return rawUrl;

        const devHost = getDevServerHost();
        if (devHost) {
            parsed.hostname = devHost;
            return parsed.toString();
        }

        if (Platform.OS === 'android') {
            parsed.hostname = '10.0.2.2';
            return parsed.toString();
        }

        return rawUrl;
    } catch {
        return rawUrl;
    }
}

export function getApiUrl(): string {
    const rawUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!rawUrl) {
        throw new Error('EXPO_PUBLIC_API_URL is not defined');
    }
    const resolved = resolveLocalhostUrl(rawUrl).replace(/\/$/, '');
    console.log(`[Network] Resolved API URL: ${resolved} (Source: ${rawUrl})`);
    return resolved;
}
