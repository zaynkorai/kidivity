import type { ActivityCategory } from '@/constants/categories';

export interface JourneyItem {
    id: string;
    user_id: string;
    kid_profile_id: string;
    activity_id: string | null;
    title: string;
    category: ActivityCategory;
    scheduled_date: string; // YYYY-MM-DD
    created_at: string;
}

export interface ActivityCompletion {
    id: string;
    user_id: string;
    kid_profile_id: string;
    activity_id: string | null;
    journey_item_id: string | null;
    completed_at: string;
    completed_date: string; // YYYY-MM-DD
}

export interface ScheduleActivityInput {
    kid_profile_id: string;
    activity_id: string | null;
    title: string;
    category: ActivityCategory;
    scheduled_date: string;
}
