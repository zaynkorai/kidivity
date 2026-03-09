import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Activity, GenerateActivityInput } from '@/types/activity';

interface ActivityState {
    recentActivities: Activity[];
    savedActivities: Activity[];
    isGenerating: boolean;
    isLoading: boolean;
}

interface ActivityActions {
    fetchRecent: () => Promise<void>;
    fetchSaved: () => Promise<void>;
    generateActivity: (input: GenerateActivityInput) => Promise<{ data: Activity | null; error: string | null }>;
    toggleSaved: (id: string) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;
}

type ActivityStore = ActivityState & ActivityActions;

export const useActivityStore = create<ActivityStore>()(
    persist(
        (set, get) => ({
            // State
            recentActivities: [],
            savedActivities: [],
            isGenerating: false,
            isLoading: false,

            // Actions
            fetchRecent: async () => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase
                        .from('activities')
                        .select('*, kid_profiles(name)')
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (!error && data) {
                        const activities: Activity[] = data.map((row: any) => ({
                            ...row,
                            kid_name: row.kid_profiles?.name,
                            kid_profiles: undefined,
                        }));
                        set({ recentActivities: activities });
                    }
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchSaved: async () => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase
                        .from('activities')
                        .select('*, kid_profiles(name)')
                        .eq('is_saved', true)
                        .order('created_at', { ascending: false });

                    if (!error && data) {
                        const activities: Activity[] = data.map((row: any) => ({
                            ...row,
                            kid_name: row.kid_profiles?.name,
                            kid_profiles: undefined,
                        }));
                        set({ savedActivities: activities });
                    }
                } finally {
                    set({ isLoading: false });
                }
            },

            generateActivity: async (input) => {
                set({ isGenerating: true });
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                        set({ isGenerating: false });
                        return { data: null, error: 'Not authenticated' };
                    }

                    const response = await supabase.functions.invoke('generate-activity', {
                        body: input,
                    });

                    if (response.error) {
                        set({ isGenerating: false });
                        return { data: null, error: response.error.message };
                    }

                    const activity = response.data as Activity;

                    // Add to recent activities
                    const { recentActivities } = get();
                    set({
                        recentActivities: [activity, ...recentActivities].slice(0, 10),
                        isGenerating: false,
                    });

                    return { data: activity, error: null };
                } catch {
                    set({ isGenerating: false });
                    return { data: null, error: 'Failed to generate activity' };
                }
            },

            toggleSaved: async (id) => {
                const { recentActivities, savedActivities } = get();
                const activity = [...recentActivities, ...savedActivities].find(a => a.id === id);
                if (!activity) return;

                const newSavedState = !activity.is_saved;

                // Optimistic update
                set({
                    recentActivities: recentActivities.map(a =>
                        a.id === id ? { ...a, is_saved: newSavedState } : a
                    ),
                    savedActivities: newSavedState
                        ? [...savedActivities, { ...activity, is_saved: true }]
                        : savedActivities.filter(a => a.id !== id),
                });

                // Sync to Supabase
                await supabase
                    .from('activities')
                    .update({ is_saved: newSavedState })
                    .eq('id', id);
            },

            deleteActivity: async (id) => {
                const { recentActivities, savedActivities } = get();
                set({
                    recentActivities: recentActivities.filter(a => a.id !== id),
                    savedActivities: savedActivities.filter(a => a.id !== id),
                });

                await supabase.from('activities').delete().eq('id', id);
            },
        }),
        {
            name: 'kidivity-activities',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                recentActivities: state.recentActivities,
                savedActivities: state.savedActivities,
            }),
        }
    )
);
