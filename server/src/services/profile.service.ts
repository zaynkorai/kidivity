import { SupabaseClient } from '@supabase/supabase-js';

export class ProfileService {
    constructor(private supabase: SupabaseClient) {}

    async getProfiles() {
        const { data, error } = await this.supabase
            .from('kid_profiles')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        return data;
    }

    async deleteProfile(id: string) {
        const { error } = await this.supabase
            .from('kid_profiles')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }
    }
}
