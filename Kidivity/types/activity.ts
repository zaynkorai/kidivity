import type { ActivityCategory } from '@/constants/categories';

export type ActivityDifficulty = 'easy' | 'medium' | 'hard';
export type ActivityStyle = 'bw' | 'colorful';

export interface Activity {
    id: string;
    user_id: string;
    kid_profile_id: string;
    category: ActivityCategory;
    topic: string;
    difficulty: ActivityDifficulty;
    style: ActivityStyle;
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
}
