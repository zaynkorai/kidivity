import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAdminClient } from '../lib/supabase.js';

// Extend Fastify's request type to include our user
declare module 'fastify' {
    interface FastifyRequest {
        userId: string;
        accessToken: string;
    }
}

/**
 * Auth plugin — extracts the Supabase JWT from the Authorization header,
 * verifies it, and attaches `userId` + `accessToken` to the request.
 */
async function authPlugin(fastify: FastifyInstance) {
    fastify.decorateRequest('userId', '');
    fastify.decorateRequest('accessToken', '');

    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        // Skip auth for health check
        if (request.url === '/health') return;

        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = getAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return reply.code(401).send({ error: 'Invalid or expired token' });
        }

        request.userId = user.id;
        request.accessToken = token;
    });
}

export default fp(authPlugin, { name: 'auth' });
