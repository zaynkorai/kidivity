import { z } from 'zod';

export const generateSchema = z.object({
    kid_profile_id: z.string().uuid(),
    category: z.enum(['logic', 'tracing', 'educational', 'screen-free']),
    topic: z.string().min(1).max(100),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    style: z.enum(['bw', 'colorful']),
    format: z.enum(['printable', 'parent-led', 'screen-free-play']).default('printable'),
    time_available: z.enum(['5min', '20min', '1hr+']).default('20min'),
    energy_level: z.enum(['exhausted', 'moderate', 'high']).default('moderate'),
    environment: z.enum(['indoor', 'kitchen', 'on-the-go']).default('indoor'),
});

export type GenerateBody = z.infer<typeof generateSchema>;
