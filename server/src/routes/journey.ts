import type { FastifyInstance } from 'fastify';
import { getUserClient } from '../lib/supabase.js';
import { JourneyService } from '../services/journey.service.js';

export default async function journeyRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: { kid_profile_id: string; activity_id: string | null; title: string; category: string; scheduled_date: string } }>(
        '/api/journey/schedule',
        async (request, reply) => {
            const supabase = getUserClient(request.accessToken);
            const journeyService = new JourneyService(supabase);

            try {
                const data = await journeyService.scheduleActivity(request.userId, request.body);
                return data;
            } catch (error: any) {
                fastify.log.error('Failed to schedule activity: %o', error);
                return reply.code(500).send({ error: 'Failed to schedule activity' });
            }
        }
    );
}
