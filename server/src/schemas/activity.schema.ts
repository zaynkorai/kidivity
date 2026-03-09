import { z } from 'zod';

export const generateSchema = z.object({
    kid_profile_id: z.string().uuid(),
    category: z.enum(['puzzles', 'tracing', 'science', 'art', 'math', 'reading']),
    topic: z.string().min(1).max(100),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    style: z.enum(['bw', 'colorful']),
    simpleTracingPaths: z.boolean().default(true),
    coloringBookMode: z.boolean().default(true),
});

export type GenerateBody = z.infer<typeof generateSchema>;
