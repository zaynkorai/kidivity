import type { FastifyInstance } from 'fastify';
import { getAdminClient } from '../lib/supabase.js';
import { syncOnboardingSchema, SyncOnboardingBody } from '../schemas/onboarding.schema.js';

export default async function onboardingRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/onboarding/sessions/sync
     * Persists or updates the current onboarding state for the user.
     */
    fastify.post<{ Body: SyncOnboardingBody }>('/api/onboarding/sessions/sync', async (request, reply) => {
        const parsed = syncOnboardingSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: 'Invalid onboarding sync data',
                details: parsed.error.errors,
            });
        }

        const supabase = getAdminClient();
        const { status, step, metadata } = parsed.data;

        const { data, error } = await supabase
            .from('onboarding_sessions')
            .upsert({
                user_id: request.userId,
                status,
                step,
                metadata: metadata || {},
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            fastify.log.error('[Onboarding] Sync error: %o', error);
            return reply.code(500).send({ error: 'Failed to sync onboarding state' });
        }

        return data;
    });

    /**
     * POST /api/onboarding/sessions/restore
     * Retrieves the latest onboarding state for the authenticated user.
     */
    fastify.post('/api/onboarding/sessions/restore', async (request, reply) => {
        const supabase = getAdminClient();
        
        const { data, error } = await supabase
            .from('onboarding_sessions')
            .select('*')
            .eq('user_id', request.userId)
            .maybeSingle();

        if (error) {
            fastify.log.error('[Onboarding] Restore error: %o', error);
            return reply.code(500).send({ error: 'Failed to restore onboarding session' });
        }

        if (!data) {
            return reply.code(404).send({ error: 'No onboarding session found' });
        }

        return data;
    });
}
