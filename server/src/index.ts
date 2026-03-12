import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'crypto';
import authPlugin from './plugins/auth.js';
import activityRoutes from './routes/activities.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
    const isDev = process.env.NODE_ENV !== 'production';

    const fastify = Fastify({
        // Override fastify default auto-incrementing id with a UUID
        genReqId: () => randomUUID(),
        logger: {
            level: 'info',
            // Detailed custom serializers to keep logs readable but informative
            serializers: {
                req(request) {
                    return {
                        method: request.method,
                        url: request.url,
                        routeUrl: request.routeOptions.url,
                        pathParams: request.params,
                        queryParams: request.query,
                        ip: request.ip,
                    };
                },
                res(reply) {
                    return {
                        statusCode: reply.statusCode,
                    };
                },
            },
            ...(isDev
                ? {
                      transport: {
                          target: 'pino-pretty',
                          options: {
                              colorize: true,
                              translateTime: 'HH:MM:ss Z',
                              ignore: 'pid,hostname',
                          },
                      },
                  }
                : {}), // In production, default to structured JSON logs
        },
    });

    // ── Pre-handler: Inject request ID into response  ──
    fastify.addHook('onSend', async (request, reply, payload) => {
        reply.header('x-request-id', request.id);
        return payload;
    });

    // ── Plugins ──────────────────────────────────────────
    await fastify.register(cors, {
        origin: true, // Allow all origins in dev; lock down in production
        credentials: true,
    });

    await fastify.register(rateLimit, {
        max: 30,
        timeWindow: '1 minute',
    });

    await fastify.register(authPlugin);

    // ── Routes ───────────────────────────────────────────
    await fastify.register(activityRoutes);

    // Health check (skips auth via plugin logic)
    fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // ── Global error handler ─────────────────────────────
    fastify.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
        fastify.log.error(error);
        const statusCode = error.statusCode ?? 500;
        const isClientError = statusCode >= 400 && statusCode < 500;
        reply.code(statusCode).send({
            error: isClientError ? error.message : 'An unexpected error occurred. Please try again later.',
        });
    });

    // ── Start ────────────────────────────────────────────
    try {
        await fastify.listen({ port: PORT, host: HOST });
        fastify.log.info(`🚀 Kaivity API running at http://${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

main();
