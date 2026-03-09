import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.js';
import activityRoutes from './routes/activities.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
    const fastify = Fastify({
        logger: {
            transport: {
                target: 'pino-pretty',
                options: { colorize: true },
            },
        },
    });

    // ── Plugins ──────────────────────────────────────────
    await fastify.register(cors, {
        origin: true, // Allow all origins in dev; lock down in production
        credentials: true,
    });

    await fastify.register(authPlugin);

    // ── Routes ───────────────────────────────────────────
    await fastify.register(activityRoutes);

    // Health check (skips auth via plugin logic)
    fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // ── Global error handler ─────────────────────────────
    fastify.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
        fastify.log.error(error);
        reply.code(error.statusCode ?? 500).send({
            error: error.message || 'Internal server error',
        });
    });

    // ── Start ────────────────────────────────────────────
    try {
        await fastify.listen({ port: PORT, host: HOST });
        fastify.log.info(`🚀 Kidivity API running at http://${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

main();
