import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Activity, GenerateActivityInput } from '@/types/activity';

interface RateLimitState {
    hit: boolean;
    used: number;
    limit: number;
    resetAt: string | null;
}

interface ActivityState {
    recentActivities: Activity[];
    savedActivities: Activity[];
    isGenerating: boolean;
    isLoading: boolean;
    rateLimitState: RateLimitState;
}

interface ActivityActions {
    fetchRecent: () => Promise<void>;
    fetchSaved: () => Promise<void>;
    generateActivity: (input: GenerateActivityInput) => Promise<{ data: Activity | null; error: string | null }>;
    toggleSaved: (id: string) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;
    clearRateLimit: () => void;
}

type ActivityStore = ActivityState & ActivityActions;

const DEFAULT_RATE_LIMIT: RateLimitState = { hit: false, used: 0, limit: 10, resetAt: null };

export const useActivityStore = create<ActivityStore>()(
    persist(
        (set, get) => ({
            recentActivities: [],
            savedActivities: [],
            isGenerating: false,
            isLoading: false,
            rateLimitState: DEFAULT_RATE_LIMIT,

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

                    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';
                    const response = await fetch(`${apiUrl}/api/activities/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify(input),
                    });

                    const data = await response.json();

                    if (response.status === 429) {
                        set({
                            isGenerating: false,
                            rateLimitState: {
                                hit: true,
                                used: data.used ?? 10,
                                limit: data.limit ?? 10,
                                resetAt: data.reset_at ?? null,
                            },
                        });
                        return { data: null, error: 'rate_limit' };
                    }

                    if (!response.ok) {
                        set({ isGenerating: false });
                        return { data: null, error: data.error || 'Failed to generate activity' };
                    }

                    const activity = data as Activity;
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

                set({
                    recentActivities: recentActivities.map(a =>
                        a.id === id ? { ...a, is_saved: newSavedState } : a
                    ),
                    savedActivities: newSavedState
                        ? [...savedActivities, { ...activity, is_saved: true }]
                        : savedActivities.filter(a => a.id !== id),
                });

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

            clearRateLimit: () => set({ rateLimitState: DEFAULT_RATE_LIMIT }),
        }),
        {
            name: 'kidivity-activities',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => {
                // Remove base64 image_urls from persisted state to prevent AsyncStorage quota errors
                const stripHeavyData = (activities: Activity[]) =>
                    activities.map(({ image_url, ...rest }) => rest as Activity);

                return {
                    recentActivities: stripHeavyData(state.recentActivities),
                    savedActivities: stripHeavyData(state.savedActivities),
                };
            },
        }
    )
);
