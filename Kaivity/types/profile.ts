import type { GradeLevel } from '@/constants/grades';

export interface KidProfile {
    id: string;
    user_id: string;
    name: string;
    age: number;
    grade_level: GradeLevel;
    avatar_color: string;
    activity_count: number;
    created_at: string;
    updated_at: string;
}

export type CreateKidProfileInput = Pick<
    KidProfile,
    'name' | 'age' | 'grade_level' | 'avatar_color'
>;

export type UpdateKidProfileInput = Partial<CreateKidProfileInput>;
