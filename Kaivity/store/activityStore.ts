import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/network';
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
    kidStats: Record<
        string,
        { total: number; streak: number; weekCount: number; lastCreatedAt: string | null }
    >;
    isGenerating: boolean;
    isFetchingRecent: boolean;
    isFetchingSaved: boolean;
    rateLimitState: RateLimitState;
}

interface ActivityActions {
    fetchRecent: () => Promise<void>;
    fetchSaved: () => Promise<void>;
    fetchKidStats: (kidProfileId: string) => Promise<void>;
    generateActivity: (input: GenerateActivityInput) => Promise<{ data: Activity | null; error: string | null }>;
    toggleSaved: (id: string) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;
    clearRateLimit: () => void;
    reset: () => void;
}

type ActivityStore = ActivityState & ActivityActions;

const DEFAULT_RATE_LIMIT: RateLimitState = { hit: false, used: 0, limit: 10, resetAt: null };

export const useActivityStore = create<ActivityStore>()(
    persist(
        (set, get) => ({
            recentActivities: [],
            savedActivities: [],
            kidStats: {},
            isGenerating: false,
            isFetchingRecent: false,
            isFetchingSaved: false,
            rateLimitState: DEFAULT_RATE_LIMIT,

            fetchRecent: async () => {
                set({ isFetchingRecent: true });
                try {
                    const { data, error } = await supabase
                        .from('activities')
                        .select('*, kid_profiles(name)')
                        .order('created_at', { ascending: false })
                        .limit(50);

                    if (!error && data) {
                        const activities: Activity[] = data.map((row: any) => ({
                            ...row,
                            kid_name: row.kid_profiles?.name,
                            kid_profiles: undefined,
                        }));
                        set({ recentActivities: activities });
                    }
                } finally {
                    set({ isFetchingRecent: false });
                }
            },

            fetchSaved: async () => {
                set({ isFetchingSaved: true });
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
                    set({ isFetchingSaved: false });
                }
            },

            fetchKidStats: async (kidProfileId) => {
                try {
                    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
                    const { data, error } = await supabase.rpc('get_kid_activity_stats', {
                        p_kid_profile_id: kidProfileId,
                        p_timezone_name: timezoneName,
                    });

                    if (error) {
                        console.error('[fetchKidStats] RPC Error:', error);
                        return;
                    }

                    if (data) {
                        set((state) => ({
                            kidStats: {
                                ...state.kidStats,
                                [kidProfileId]: {
                                    total: data.total ?? 0,
                                    streak: data.streak ?? 0,
                                    weekCount: data.weekCount ?? 0,
                                    lastCreatedAt: data.lastCreatedAt ?? null,
                                },
                            },
                        }));
                    }
                } catch (err) {
                    console.error('[fetchKidStats] Exception:', err);
                    // Non-critical: home can still render without stats.
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

                    const apiUrl = getApiUrl();

                    const response = await fetch(`${apiUrl}/api/activities/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify(input),
                    });

                    const text = await response.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (parseError) {
                        console.error('[Generate] Invalid JSON response. Status:', response.status, 'Body:', text.slice(0, 200));
                        set({ isGenerating: false });
                        return { data: null, error: `Server error (${response.status})` };
                    }

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
                        console.error('[Generate] API Error:', data);
                        set({ isGenerating: false });
                        return { data: null, error: data.error || 'Failed to generate activity' };
                    }

                    const activity = data as Activity;
                    set((state) => ({
                        recentActivities: [activity, ...state.recentActivities].slice(0, 50),
                        isGenerating: false,
                    }));

                    return { data: activity, error: null };
                } catch (error) {
                    console.error('[Generate] Exception:', error);
                    set({ isGenerating: false });
                    return { data: null, error: 'Failed to generate activity' };
                }
            },

            toggleSaved: async (id) => {
                const snapshot = get();
                const activity = [...snapshot.recentActivities, ...snapshot.savedActivities].find(a => a.id === id);
                if (!activity) return;

                const newSavedState = !activity.is_saved;

                // Optimistic update
                set((state) => ({
                    recentActivities: state.recentActivities.map(a =>
                        a.id === id ? { ...a, is_saved: newSavedState } : a
                    ),
                    savedActivities: newSavedState
                        ? [...state.savedActivities, { ...activity, is_saved: true }]
                        : state.savedActivities.filter(a => a.id !== id),
                }));

                const { error } = await supabase
                    .from('activities')
                    .update({ is_saved: newSavedState })
                    .eq('id', id);

                if (error) {
                    console.error('[toggleSaved] Failed to update db:', error);
                    // Rollback using functional update to avoid overwriting concurrent changes
                    set((state) => ({
                        recentActivities: state.recentActivities.map(a =>
                            a.id === id ? { ...a, is_saved: !newSavedState } : a
                        ),
                        savedActivities: !newSavedState
                            ? [...state.savedActivities, { ...activity, is_saved: false }]
                            : state.savedActivities.filter(a => a.id !== id),
                    }));
                }
            },

            deleteActivity: async (id) => {
                const snapshot = get();
                set((state) => ({
                    recentActivities: state.recentActivities.filter(a => a.id !== id),
                    savedActivities: state.savedActivities.filter(a => a.id !== id),
                }));
                
                const { error } = await supabase.from('activities').delete().eq('id', id);
                if (error) {
                    console.error('[deleteActivity] Failed to delete from db:', error);
                    set({
                        recentActivities: snapshot.recentActivities,
                        savedActivities: snapshot.savedActivities,
                    });
                }
            },

            clearRateLimit: () => set({ rateLimitState: DEFAULT_RATE_LIMIT }),

            reset: () => set({
                recentActivities: [],
                savedActivities: [],
                kidStats: {},
                isGenerating: false,
                isFetchingRecent: false,
                isFetchingSaved: false,
                rateLimitState: DEFAULT_RATE_LIMIT,
            }),
        }),
        {
            name: 'kaivity-activity-cache',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                recentActivities: state.recentActivities.slice(0, 20),
                savedActivities: state.savedActivities,
            }),
        }
    )
);
