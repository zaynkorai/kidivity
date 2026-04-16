import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

// Extend Fastify's request type to include our user
declare module 'fastify' {
    interface FastifyRequest {
        userId: string;
        accessToken: string;
    }
}

/**
 * Auth plugin — extracts the Supabase JWT from the Authorization header,
 * verifies it LOCALLY using the JWT secret (no network hop), and attaches
 * `userId` + `accessToken` to the request.
 */
async function authPlugin(fastify: FastifyInstance) {
    fastify.decorateRequest('userId', '');
    fastify.decorateRequest('accessToken', '');

    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        // Skip auth for health check and webhooks
        if (request.url === '/health' || request.url.startsWith('/api/webhooks/')) return;

        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        
        if (!jwtSecret) {
            fastify.log.error('SUPABASE_JWT_SECRET is not configured in environment.');
            return reply.code(500).send({ error: 'Internal server initialization error' });
        }

        try {
            // Verify JWT locally using the secret. This is instantaneous (<1ms).
            const decoded = jwt.verify(token, jwtSecret) as { sub: string };
            
            if (!decoded.sub) {
                return reply.code(401).send({ error: 'Invalid token payload' });
            }

            request.userId = decoded.sub;
            request.accessToken = token;
        } catch (error) {
            fastify.log.warn(`JWT Verification failed: ${error}`);
            return reply.code(401).send({ error: 'Invalid or expired token' });
        }
    });
}

export default fp(authPlugin, { name: 'auth' });
