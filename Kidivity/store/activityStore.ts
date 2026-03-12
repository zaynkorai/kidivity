import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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
    kidStats: Record<
        string,
        { total: number; streak: number; weekCount: number; lastCreatedAt: string | null }
    >;
    isGenerating: boolean;
    isLoading: boolean;
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
            isLoading: false,
            rateLimitState: DEFAULT_RATE_LIMIT,

            fetchRecent: async () => {
                set({ isLoading: true });
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

            fetchKidStats: async (kidProfileId) => {
                try {
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

                    const [totalRes, datesRes, weekRes, lastRes] = await Promise.all([
                        supabase
                            .from('activities')
                            .select('id', { count: 'exact', head: true })
                            .eq('kid_profile_id', kidProfileId),
                        supabase
                            .from('activities')
                            .select('created_at')
                            .eq('kid_profile_id', kidProfileId)
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('activities')
                            .select('id', { count: 'exact', head: true })
                            .eq('kid_profile_id', kidProfileId)
                            .gte('created_at', weekAgo),
                        supabase
                            .from('activities')
                            .select('created_at')
                            .eq('kid_profile_id', kidProfileId)
                            .order('created_at', { ascending: false })
                            .limit(1),
                    ]);

                    const total = totalRes.count ?? 0;
                    const weekCount = weekRes.count ?? 0;
                    const lastCreatedAt = lastRes.data?.[0]?.created_at ?? null;

                    // Calculate streak
                    let streak = 0;
                    if (datesRes.data && datesRes.data.length > 0) {
                        const formatDateLocal = (date: Date) => {
                            return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
                        };
                        const dates = datesRes.data.map((d: any) => formatDateLocal(new Date(d.created_at)));
                        const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
                        
                        const today = new Date();
                        const todayStr = formatDateLocal(today);
                        
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = formatDateLocal(yesterday);
                        
                        if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
                            streak = 1;
                            const [y, m, d] = uniqueDates[0].split('-').map(Number);
                            let currentDate = new Date(y, m - 1, d);
                            
                            for (let i = 1; i < uniqueDates.length; i++) {
                                currentDate.setDate(currentDate.getDate() - 1);
                                const expectedStr = formatDateLocal(currentDate);
                                if (uniqueDates[i] === expectedStr) {
                                    streak++;
                                } else {
                                    break;
                                }
                            }
                        }
                    }

                    set({
                        kidStats: {
                            ...get().kidStats,
                            [kidProfileId]: { total, streak, weekCount, lastCreatedAt },
                        },
                    });
                } catch {
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

                    let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';
                    
                    // Android resilience: localhost doesn't work on real devices
                    if (Platform.OS !== 'web' && apiUrl.includes('localhost')) {
                        apiUrl = apiUrl.replace('localhost', '172.16.162.13'); 
                    }

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
                        console.error('[Generate] API Error:', data);
                        set({ isGenerating: false });
                        return { data: null, error: data.error || 'Failed to generate activity' };
                    }

                    const activity = data as Activity;
                    const { recentActivities } = get();
                    set({
                        recentActivities: [activity, ...recentActivities].slice(0, 50),
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
