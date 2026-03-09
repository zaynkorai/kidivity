import type { GradeLevel } from '@/constants/grades';
import type { Interest } from '@/constants/interests';

export interface KidProfile {
    id: string;
    user_id: string;
    name: string;
    age: number;
    grade_level: GradeLevel;
    interests: Interest[];
    avatar_color: string;
    activity_count: number;
    created_at: string;
    updated_at: string;
}

export type CreateKidProfileInput = Pick<
    KidProfile,
    'name' | 'age' | 'grade_level' | 'interests' | 'avatar_color'
>;

export type UpdateKidProfileInput = Partial<CreateKidProfileInput>;
