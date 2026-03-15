import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/network';
import { prefetchActivityImages } from '@/lib/image';
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
    fetchActivityDetail: (id: string) => Promise<Activity | null>;
    generateActivity: (input: GenerateActivityInput) => Promise<{ data: Activity | null; error: string | null }>;
    toggleSaved: (id: string) => Promise<void>;
    submitFeedback: (id: string, rating: number, feedbackText?: string) => Promise<void>;
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
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;

                    const apiUrl = getApiUrl();
                    const response = await fetch(`${apiUrl}/api/activities`, {
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                    });

                    if (response.ok) {
                        const activities = await response.json();
                        set({ recentActivities: activities });
                        
                        // Prefetch images for the latest activities - CAP AT 5 for egress optimization
                        prefetchActivityImages(activities.slice(0, 5).map((a: any) => a.image_url));
                    }
                } catch (error) {
                    console.error('Failed to fetch recent activities:', error);
                } finally {
                    set({ isFetchingRecent: false });
                }
            },

            fetchSaved: async () => {
                set({ isFetchingSaved: true });
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;

                    const apiUrl = getApiUrl();
                    const response = await fetch(`${apiUrl}/api/activities/saved`, {
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                    });

                    if (response.ok) {
                        const activities = await response.json();
                        set({ savedActivities: activities });
                        
                        // Prefetch saved images - CAP AT 5 for egress optimization
                        prefetchActivityImages(activities.slice(0, 5).map((a: any) => a.image_url));
                    }
                } catch (error) {
                    console.error('Failed to fetch saved activities:', error);
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

            fetchActivityDetail: async (id) => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return null;

                    const apiUrl = getApiUrl();
                    const response = await fetch(`${apiUrl}/api/activities/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                    });

                    if (response.ok) {
                        const fullActivity = await response.json();
                        // Update or add to the local store lists
                        set((state) => {
                            const inRecent = state.recentActivities.some(a => a.id === id);
                            const inSaved = state.savedActivities.some(a => a.id === id);
                            
                            return {
                                recentActivities: inRecent 
                                    ? state.recentActivities.map(a => a.id === id ? fullActivity : a)
                                    : [fullActivity, ...state.recentActivities].slice(0, 50),
                                savedActivities: inSaved
                                    ? state.savedActivities.map(a => a.id === id ? fullActivity : a)
                                    : state.savedActivities
                            };
                        });
                        return fullActivity;
                    }
                } catch (error) {
                    console.error('Failed to fetch activity detail:', error);
                }
                return null;
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

                    // Prefetch the new image immediately
                    if (activity.image_url) {
                        prefetchActivityImages([activity.image_url]);
                    }

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


            submitFeedback: async (id, rating, feedbackText) => {
                const snapshot = get();
                const activity = [...snapshot.recentActivities, ...snapshot.savedActivities].find(a => a.id === id);
                if (!activity) return;

                // Optimistic update
                set((state) => ({
                    recentActivities: state.recentActivities.map(a =>
                        a.id === id ? { ...a, rating, feedback_text: feedbackText } : a
                    ),
                    savedActivities: state.savedActivities.map(a =>
                        a.id === id ? { ...a, rating, feedback_text: feedbackText } : a
                    ),
                }));

                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;

                    const apiUrl = getApiUrl();
                    const response = await fetch(`${apiUrl}/api/activities/${id}/feedback`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ rating, feedback_text: feedbackText }),
                    });

                    if (!response.ok) {
                        throw new Error('Feedback submission failed');
                    }
                } catch (error) {
                    console.error('[submitFeedback] Failed:', error);
                    // Rollback on error
                    set((state) => ({
                        recentActivities: state.recentActivities.map(a =>
                            a.id === id ? { ...a, rating: activity.rating, feedback_text: activity.feedback_text } : a
                        ),
                        savedActivities: state.savedActivities.map(a =>
                            a.id === id ? { ...a, rating: activity.rating, feedback_text: activity.feedback_text } : a
                        ),
                    }));
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
            storage: createJSONStorage(() => safeStorage),
            partialize: (state) => ({
                recentActivities: state.recentActivities.slice(0, 10),
                savedActivities: state.savedActivities.slice(0, 5),
            }),
        }
    )
);
