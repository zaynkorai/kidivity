import type { FastifyInstance } from 'fastify';
import { getAdminClient } from '../lib/supabase.js';

export default async function accountRoutes(fastify: FastifyInstance) {
    /**
     * DELETE /api/account
     * Permanently deletes the authenticated user's account and all associated data.
     */
    fastify.delete('/api/account', async (request, reply) => {
        const { userId } = request;
        
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const supabase = getAdminClient();

        // 1. Delete associated data (Supabase RLS or DB triggers should handle most, 
        // but we can be explicit here if needed. Usually auth.deleteUser is enough 
        // if ON DELETE CASCADE is set up, but auth.users is in a different schema).
        // For Kidivity, we might want to ensure kid_profiles, etc. are gone.
        
        // Note: auth.admin.deleteUser deletes the user from auth.users.
        // If kid_profiles has an ON DELETE CASCADE on user_id, they will be deleted.
        
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            fastify.log.error({ err: error, userId }, 'Failed to delete user account');
            return reply.code(500).send({ error: 'Failed to delete account. Please try again later.' });
        }

        fastify.log.info({ userId }, 'Successfully deleted user account');
        
        return reply.code(204).send();
    });
}
