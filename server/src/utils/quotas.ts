import type { SupabaseClient } from '@supabase/supabase-js';

export interface QuotaResult {
    allowed: boolean;
    used: number;
    limit: number;
    reset_at: string;
}

/**
 * Checks the per-user generation quota based on their tier.
 * 
 * DESIGN:
 * - Free (limit 1): 1 generation every 48 hours.
 * - Monthly Pro (limit 100): 100 generations per 30 days.
 * - Annual Pro (limit 10): 10 generations per 24 hours.
 */
export async function checkQuota(
    adminClient: SupabaseClient,
    userId: string,
    timezone: string = 'UTC'
): Promise<QuotaResult> {
    const now = new Date();
    
    // 1. Fetch user's limit from DB
    const { data: userData } = await adminClient
        .from('users')
        .select('generation_limit')
        .eq('id', userId)
        .single();

    const limit = userData?.generation_limit ?? 1;

    // 2. Determine Lookback Window
    let windowStart: Date;
    let periodName: string;

    if (limit === 1) {
        // Free: 48 hour window
        windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        periodName = '48h';
    } else if (limit === 100) {
        // Monthly Pro: 30 day window
        windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        periodName = '30d';
    } else {
        // Annual Pro (10) or Fallback: 24 hour window
        windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        periodName = '24h';
    }

    // 3. Count activities in this window
    const { count, error } = await adminClient
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['generating', 'completed'])
        .gte('created_at', windowStart.toISOString());

    const used = error ? 0 : (count ?? 0);

    // 4. Calculate "Reset At" (Estimated time when first activity in window expires)
    let resetAt = new Date(now.getTime() + 60 * 60 * 1000); // Default to +1h if empty
    if (used > 0) {
        const { data: oldestInWindow } = await adminClient
            .from('activities')
            .select('created_at')
            .eq('user_id', userId)
            .in('status', ['generating', 'completed'])
            .gte('created_at', windowStart.toISOString())
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (oldestInWindow) {
            const oldestDate = new Date(oldestInWindow.created_at);
            if (limit === 1) resetAt = new Date(oldestDate.getTime() + 48 * 60 * 60 * 1000);
            else if (limit === 100) resetAt = new Date(oldestDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            else resetAt = new Date(oldestDate.getTime() + 24 * 60 * 60 * 1000);
        }
    }

    console.log(`[QuotaCheck] user=${userId} tier=${limit} window=${periodName} used=${used}/${limit}`);

    return {
        allowed: used < limit,
        used,
        limit,
        reset_at: resetAt.toISOString(),
    };
}
