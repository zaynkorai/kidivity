import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/network';
import { toLocalDateString } from '@/lib/dates';
import type { ActivityCompletion, JourneyItem, ScheduleActivityInput } from '@/types/journey';

interface JourneyState {
    journeyItems: JourneyItem[];
    completions: ActivityCompletion[];
    isFetching: boolean;
    isSaving: boolean;
}

interface JourneyActions {
    fetchWeek: (kidProfileId: string, weekStart: string, weekEnd: string) => Promise<void>;
    scheduleActivity: (input: ScheduleActivityInput) => Promise<{ data: JourneyItem | null; error: string | null }>;
    toggleCompletionForJourneyItem: (journeyItem: JourneyItem) => Promise<void>;
    completeActivityAdhoc: (kidProfileId: string, activityId: string) => Promise<{ completed: boolean }>; 
}

type JourneyStore = JourneyState & JourneyActions;

export const useJourneyStore = create<JourneyStore>()((set, get) => ({
    journeyItems: [],
    completions: [],
    isFetching: false,
    isSaving: false,

    fetchWeek: async (kidProfileId, weekStart, weekEnd) => {
        set({ isFetching: true });
        try {
            const [itemsRes, completionRes] = await Promise.all([
                supabase
                    .from('journey_items')
                    .select('*')
                    .eq('kid_profile_id', kidProfileId)
                    .gte('scheduled_date', weekStart)
                    .lte('scheduled_date', weekEnd)
                    .order('scheduled_date', { ascending: true }),
                supabase
                    .from('activity_completions')
                    .select('*')
                    .eq('kid_profile_id', kidProfileId)
                    .gte('completed_date', weekStart)
                    .lte('completed_date', weekEnd)
                    .order('completed_at', { ascending: false }),
            ]);

            if (!itemsRes.error && itemsRes.data) {
                set({ journeyItems: itemsRes.data as JourneyItem[] });
            }
            if (!completionRes.error && completionRes.data) {
                set({ completions: completionRes.data as ActivityCompletion[] });
            }
        } finally {
            set({ isFetching: false });
        }
    },

    scheduleActivity: async (input) => {
        set({ isSaving: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { data: null, error: 'Not authenticated' };
            }

            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/api/journey/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return { data: null, error: errorData.error || 'Failed to schedule activity' };
            }

            const data = await response.json();
            const items = get().journeyItems;
            set({ journeyItems: [...items, data as JourneyItem] });
            return { data: data as JourneyItem, error: null };
        } catch (error: any) {
            return { data: null, error: error.message || 'An unexpected error occurred' };
        } finally {
            set({ isSaving: false });
        }
    },

    toggleCompletionForJourneyItem: async (journeyItem) => {
        const { completions } = get();
        const existing = completions.find((c) => c.journey_item_id === journeyItem.id);

        if (existing) {
            const { error } = await supabase
                .from('activity_completions')
                .delete()
                .eq('id', existing.id);

            if (!error) {
                set({ completions: completions.filter((c) => c.id !== existing.id) });
            }
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const completedDate = journeyItem.scheduled_date || toLocalDateString(new Date());
        const { data, error } = await supabase
            .from('activity_completions')
            .insert({
                kid_profile_id: journeyItem.kid_profile_id,
                user_id: session.user.id,
                activity_id: journeyItem.activity_id,
                journey_item_id: journeyItem.id,
                completed_date: completedDate,
            })
            .select('*')
            .single();

        if (!error && data) {
            set({ completions: [data as ActivityCompletion, ...completions] });
        }
    },

    completeActivityAdhoc: async (kidProfileId, activityId) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { completed: false };

        const completedDate = toLocalDateString(new Date());
        const { data, error } = await supabase
            .from('activity_completions')
            .insert({
                user_id: session.user.id,
                kid_profile_id: kidProfileId,
                activity_id: activityId,
                completed_date: completedDate,
            })
            .select('*')
            .single();

        if (!error && data) {
            const { completions } = get();
            set({ completions: [data as ActivityCompletion, ...completions] });
            return { completed: true };
        }

        if (error && error.message?.toLowerCase().includes('duplicate')) {
            return { completed: true };
        }

        return { completed: false };
    },
}));
