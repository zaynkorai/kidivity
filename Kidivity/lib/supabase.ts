import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { resolveLocalhostUrl } from './network';

let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

supabaseUrl = resolveLocalhostUrl(supabaseUrl);

// Lazy singleton — avoids initializing during Expo Router's SSR pass
// where AsyncStorage's `window.localStorage` isn't available.
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
    }
    return _supabase;
}

// Re-export for convenience — but consumers should prefer getSupabase()
// This getter keeps the import syntax familiar while staying lazy.
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        return Reflect.get(getSupabase(), prop, receiver);
    },
});
