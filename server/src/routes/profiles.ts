import type { FastifyInstance } from 'fastify';
import { getUserClient } from '../lib/supabase.js';
import { ProfileService } from '../services/profile.service.js';

export default async function profileRoutes(fastify: FastifyInstance) {
    fastify.get('/api/profiles', async (request, reply) => {
        const supabase = getUserClient(request.accessToken);
        const profileService = new ProfileService(supabase);

        try {
            const profiles = await profileService.getProfiles();
            return profiles;
        } catch (error: any) {
            fastify.log.error('Failed to fetch profiles: %o', error);
            return reply.code(500).send({ error: 'Failed to fetch profiles' });
        }
    });

    fastify.delete<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
        const { id } = request.params;
        const supabase = getUserClient(request.accessToken);
        const profileService = new ProfileService(supabase);

        try {
            await profileService.deleteProfile(id);
            return reply.code(204).send();
        } catch (error: any) {
            fastify.log.error('Failed to delete profile: %o', error);
            return reply.code(500).send({ error: 'Failed to delete profile' });
        }
    });
}
