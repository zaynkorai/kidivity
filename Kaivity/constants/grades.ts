export const GRADE_LEVELS = [
    'Pre-K',
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade',
] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];
