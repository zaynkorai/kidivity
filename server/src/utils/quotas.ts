import type { SupabaseClient } from '@supabase/supabase-js';

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
    timezone: string = 'UTC'
): Promise<QuotaResult> {
    // Determine the start of "today" in the user's timezone
    const now = new Date();
    
    // Create a formatter for the user's timezone
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
    });

    // Format 'now' to see what time it is for the user
    const parts = fmt.formatToParts(now);
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

    // Construct a naive date string for the user's midnight
    const userMidnightStr = `${partMap.year}-${partMap.month.padStart(2, '0')}-${partMap.day.padStart(2, '0')}T00:00:00`;
    const userNowNaiveStr = `${partMap.year}-${partMap.month.padStart(2, '0')}-${partMap.day.padStart(2, '0')}T${partMap.hour.padStart(2, '0')}:${partMap.minute.padStart(2, '0')}:${partMap.second.padStart(2, '0')}`;

    const userMidnightDate = new Date(userMidnightStr);
    const userNowNaive = new Date(userNowNaiveStr);

    const msSinceMidnight = userNowNaive.getTime() - userMidnightDate.getTime();
    const todayStart = new Date(now.getTime() - msSinceMidnight);

    // Next midnight for resetAt
    const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Fetch user's custom limit from DB
    const { data: userData } = await adminClient
        .from('users')
        .select('generation_limit')
        .eq('id', userId)
        .single();

    const limit = userData?.generation_limit ?? 1; // Default to 1 if missing or NULL

    // Count activities that are either completed OR currently generating
    const { count, error } = await adminClient
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['generating', 'completed'])
        .gte('created_at', todayStart.toISOString());

    const used = error ? 0 : (count ?? 0);

    // Logging to help debug "not updating" issue
    console.log(`[QuotaCheck] user=${userId} timezone=${timezone} todayStart=${todayStart.toISOString()} used=${used} limit=${limit}`);

    return {
        allowed: used < limit,
        used,
        limit,
        reset_at: tomorrow.toISOString(),
    };
}
