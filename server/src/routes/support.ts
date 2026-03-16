import type { FastifyInstance } from 'fastify';
import { getAdminClient } from '../lib/supabase.js';
import { SupportTicketSchema } from '../schemas/support.schema.js';

export default async function supportRoutes(fastify: FastifyInstance) {
    fastify.post('/api/support', async (request, reply) => {
        fastify.log.info({ body: request.body }, 'Received support submission');
        const { userId } = request;
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const result = SupportTicketSchema.safeParse(request.body);
        if (!result.success) {
            return reply.code(400).send({ 
                error: 'Validation failed', 
                details: result.error.flatten().fieldErrors 
            });
        }

        const { category, subject, message } = result.data;
        const supabase = getAdminClient();

        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: userId,
                category,
                subject,
                message,
            })
            .select()
            .single();

        if (error) {
            fastify.log.error({ err: error }, 'Failed to create support ticket');
            return reply.code(500).send({ error: 'Failed to submit support ticket' });
        }

        return reply.code(201).send({ 
            message: 'Support ticket submitted successfully',
            ticketId: data.id 
        });
    });

    fastify.get('/api/support', async (request, reply) => {
        const { userId } = request;
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            fastify.log.error({ err: error }, 'Failed to fetch support tickets');
            return reply.code(500).send({ error: 'Failed to fetch support tickets' });
        }

        return reply.send(data);
    });
}
