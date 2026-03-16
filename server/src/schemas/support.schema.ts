import { z } from 'zod';

export const SupportTicketSchema = z.object({
    category: z.enum(['bug', 'feedback', 'question', 'other']),
    subject: z.string().min(2).max(100),
    message: z.string().min(5).max(2000),
});

export type SupportTicketInput = z.infer<typeof SupportTicketSchema>;
