import type { ActivityCategory } from '@/constants/categories';

export type ActivityDifficulty = 'easy' | 'medium' | 'hard';
export type ActivityStyle = 'bw' | 'colorful';
export type TimeAvailable = '5min' | '20min' | '1hr+';
export type EnergyLevel = 'exhausted' | 'moderate' | 'high';
export type Environment = 'indoor' | 'kitchen' | 'on-the-go';
export type ActivityFormat = 'printable' | 'parent-led' | 'screen-free-play';

export interface Activity {
    id: string;
    user_id: string;
    kid_profile_id: string;
    category: ActivityCategory;
    topic: string;
    difficulty: ActivityDifficulty;
    style: ActivityStyle;
    format: ActivityFormat;
    time_available: TimeAvailable;
    energy_level: EnergyLevel;
    environment: Environment;
    content: string;
    image_url: string | null;
    is_saved: boolean;
    created_at: string;
    // Joined from kid_profiles
    kid_name?: string;
}

export interface GenerateActivityInput {
    kid_profile_id: string;
    category: ActivityCategory;
    topic: string;
    difficulty: ActivityDifficulty;
    style: ActivityStyle;
    format?: ActivityFormat;
    time_available?: TimeAvailable;
    energy_level?: EnergyLevel;
    environment?: Environment;
}
