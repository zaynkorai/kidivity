import { SupabaseClient } from '@supabase/supabase-js';

// Fields we want for lists to minimize egress
const LIST_FIELDS = 'id, kid_profile_id, category, topic, difficulty, style, image_url, is_saved, rating, created_at, kid_profiles(name)';

export class ActivityService {
    constructor(private supabase: SupabaseClient) {}

    async getRecentActivities(limit = 50) {
        const { data, error } = await this.supabase
            .from('activities')
            .select(LIST_FIELDS)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return (data || []).map((row: any) => ({
            ...row,
            kid_name: row.kid_profiles?.name,
            kid_profiles: undefined,
        }));
    }

    async getSavedActivities() {
        const { data, error } = await this.supabase
            .from('activities')
            .select(LIST_FIELDS)
            .eq('is_saved', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            ...row,
            kid_name: row.kid_profiles?.name,
            kid_profiles: undefined,
        }));
    }

    async getActivityDetail(id: string, userId: string) {
        const { data, error } = await this.supabase
            .from('activities')
            .select('*, kid_profiles(name)')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        if (!data) return null;

        return {
            ...data,
            kid_name: data.kid_profiles?.name,
            kid_profiles: undefined,
        };
    }
}
