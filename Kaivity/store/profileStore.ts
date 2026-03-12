import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { KidProfile, CreateKidProfileInput, UpdateKidProfileInput } from '@/types/profile';

interface ProfileState {
    profiles: KidProfile[];
    activeProfileId: string | null;
    isLoading: boolean;
    hasLoadedProfiles: boolean;
}

interface ProfileActions {
    fetchProfiles: () => Promise<void>;
    addProfile: (input: CreateKidProfileInput) => Promise<{ error: string | null, data?: KidProfile }>;
    updateProfile: (id: string, updates: UpdateKidProfileInput) => Promise<{ error: string | null }>;
    deleteProfile: (id: string) => Promise<{ error: string | null }>;
    setActiveProfile: (id: string) => void;
    getActiveProfile: () => KidProfile | undefined;
    clearProfiles: () => void;
}

type ProfileStore = ProfileState & ProfileActions;

const AVATAR_COLORS = [
    '#FF8A00', '#FECAC3', '#A2DDC2', '#FFE3C1', '#8AE3FF', '#E7E1FF',
    '#FD79A8', '#00CEC9', '#E17055', '#0984E3', '#55A3E8',
];

function getRandomColor(): string {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export const useProfileStore = create<ProfileStore>()(
    persist(
        (set, get) => ({
            // State
            profiles: [],
            activeProfileId: null,
            isLoading: false,
            hasLoadedProfiles: false,

            // Actions
            fetchProfiles: async () => {
                set({ isLoading: true });
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                        set({ isLoading: false, hasLoadedProfiles: true, profiles: [] });
                        return;
                    }

                    const { data, error } = await supabase
                        .from('kid_profiles')
                        .select('*')
                        .order('created_at', { ascending: true });

                    if (error) {
                        console.error('Failed to fetch profiles:', error);
                        set({ isLoading: false, hasLoadedProfiles: true });
                        return;
                    }

                    const profiles = data as KidProfile[];
                    const { activeProfileId } = get();

                    set({
                        profiles,
                        isLoading: false,
                        hasLoadedProfiles: true,
                        // Auto-select first profile if none selected
                        activeProfileId: activeProfileId && profiles.find(p => p.id === activeProfileId)
                            ? activeProfileId
                            : profiles[0]?.id ?? null,
                    });
                } catch {
                    set({ isLoading: false, hasLoadedProfiles: true });
                }
            },

            addProfile: async (input) => {
                set({ isLoading: true });
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        set({ isLoading: false });
                        return { error: 'Not authenticated' };
                    }

                    const { data, error } = await supabase
                        .from('kid_profiles')
                        .insert({
                            ...input,
                            user_id: user.id,
                            avatar_color: input.avatar_color || getRandomColor(),
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error('[profile] addProfile error:', error.message);
                        set({ isLoading: false });
                        return { error: 'Failed to create profile. Please try again.' };
                    }

                    const profile = data as KidProfile;
                    const { profiles, activeProfileId } = get();

                    set({
                        profiles: [...profiles, profile],
                        activeProfileId: activeProfileId ?? profile.id,
                        isLoading: false,
                    });

                    return { data: profile, error: null };
                } catch {
                    set({ isLoading: false });
                    return { error: 'An unexpected error occurred' };
                }
            },

            updateProfile: async (id, updates) => {
                if (get().isLoading) return { error: 'Action in progress' };
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase
                        .from('kid_profiles')
                        .update(updates)
                        .eq('id', id)
                        .select()
                        .single();

                    if (error) {
                        console.error('[profile] updateProfile error:', error.message);
                        set({ isLoading: false });
                        return { error: 'Failed to update profile. Please try again.' };
                    }

                    const updated = data as KidProfile;
                    set((state) => ({
                        profiles: state.profiles.map(p => (p.id === id ? updated : p)),
                        isLoading: false,
                    }));

                    return { error: null };
                } catch {
                    set({ isLoading: false });
                    return { error: 'An unexpected error occurred' };
                }
            },

            deleteProfile: async (id) => {
                if (get().isLoading) return { error: 'Action in progress' };
                set({ isLoading: true });
                try {
                    const { error } = await supabase
                        .from('kid_profiles')
                        .delete()
                        .eq('id', id);

                    if (error) {
                        console.error('[profile] deleteProfile error:', error.message);
                        set({ isLoading: false });
                        return { error: 'Failed to delete profile. Please try again.' };
                    }

                    set((state) => {
                        const remaining = state.profiles.filter(p => p.id !== id);
                        return {
                            profiles: remaining,
                            activeProfileId: state.activeProfileId === id
                                ? remaining[0]?.id ?? null
                                : state.activeProfileId,
                            isLoading: false,
                        };
                    });

                    return { error: null };
                } catch {
                    set({ isLoading: false });
                    return { error: 'An unexpected error occurred' };
                }
            },

            setActiveProfile: (id) => {
                set({ activeProfileId: id });
            },

            getActiveProfile: () => {
                const { profiles, activeProfileId } = get();
                return profiles.find(p => p.id === activeProfileId);
            },
            
            clearProfiles: () => {
                set({ profiles: [], activeProfileId: null, hasLoadedProfiles: false });
            },
        }),
        {
            name: 'kaivity-profiles',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                profiles: state.profiles,
                activeProfileId: state.activeProfileId,
            }),
        }
    )
);
