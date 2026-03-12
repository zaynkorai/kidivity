import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses RLS — use only on the server.
 */
export function getAdminClient(): SupabaseClient {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

/**
 * Creates a Supabase client scoped to the current user's session.
 * Pass the user's JWT token to enforce RLS policies.
 */
export function getUserClient(accessToken: string): SupabaseClient {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            global: {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        },
    );
}
