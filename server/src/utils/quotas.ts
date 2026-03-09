import type { SupabaseClient } from '@supabase/supabase-js';

const FREE_QUOTA = 50; // activities per day

export interface QuotaResult {
    allowed: boolean;
    used: number;
    limit: number;
    reset_at: string;
}

/**
 * Checks the per-user daily activity generation quota.
 * Uses admin client (bypasses RLS) to count today's activities.
 */
export async function checkQuota(
    adminClient: SupabaseClient,
    userId: string,
): Promise<QuotaResult> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);

    const { count, error } = await adminClient
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart.toISOString());

    const used = error ? 0 : (count ?? 0);

    return {
        allowed: used < FREE_QUOTA,
        used,
        limit: FREE_QUOTA,
        reset_at: midnight.toISOString(),
    };
}
