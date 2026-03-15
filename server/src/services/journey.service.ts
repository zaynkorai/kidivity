import { SupabaseClient } from '@supabase/supabase-js';

export interface ScheduleActivityInput {
    kid_profile_id: string;
    activity_id: string | null;
    title: string;
    category: string;
    scheduled_date: string; // YYYY-MM-DD
}

export class JourneyService {
    constructor(private supabase: SupabaseClient) {}

    async scheduleActivity(userId: string, input: ScheduleActivityInput) {
        const { data, error } = await this.supabase
            .from('journey_items')
            .insert({
                ...input,
                user_id: userId,
            })
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
