import { z } from 'zod';

export const syncOnboardingSchema = z.object({
    status: z.enum(['in-progress', 'completed']),
    step: z.number().int().min(1).max(10),
    metadata: z.record(z.any()).optional(),
});

export type SyncOnboardingBody = z.infer<typeof syncOnboardingSchema>;
