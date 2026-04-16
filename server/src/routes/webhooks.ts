import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAdminClient } from '../lib/supabase.js';

// Constants for Entitlements and Quotas
const ENTITLEMENT_PRO_ANNUAL = 'pro_annual';
const ENTITLEMENT_PRO_MONTHLY = 'pro_monthly';
const ENTITLEMENT_PRO_LEGACY = 'Kidivity -Printable Activities Pro';

/**
 * NEW PROFITABLE LIMITS
 * 10  = 10 per day (Annual)
 * 100 = 100 per month (Monthly)
 * 1   = 1 per 48 hours (Free)
 */
const QUOTA_ANNUAL = 10;
const QUOTA_MONTHLY = 100;
const QUOTA_FREE = 1;

interface RevenueCatEvent {
    event: {
        type: string;
        app_user_id: string;
        original_app_user_id?: string;
        aliases?: string[];
        product_id?: string;
        entitlement_id?: string;
        entitlement_ids?: string[];
        environment?: 'SANDBOX' | 'PRODUCTION';
    };
}

export default async function webhookRoutes(fastify: FastifyInstance) {
    fastify.post('/api/webhooks/revenuecat', { config: { skipAuth: true } }, async (request: FastifyRequest<{ Body: RevenueCatEvent }>, reply: FastifyReply) => {
        const authHeader = request.headers.authorization;
        const secret = process.env.REVENUECAT_WEBHOOK_SECRET;

        if (secret && authHeader !== `Bearer ${secret}`) {
            fastify.log.warn('[RevenueCat] Unauthorized webhook attempt');
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const payload = request.body;
        if (!payload || !payload.event) {
            return reply.code(400).send({ error: 'Invalid payload' });
        }

        const event = payload.event;
        const { type, app_user_id, environment, entitlement_id, entitlement_ids, product_id } = event;

        if (!app_user_id || app_user_id.length < 5) return reply.code(200).send({ success: true });

        fastify.log.info({
            msg: 'RevenueCat Event Received',
            type,
            user: app_user_id,
            product: product_id,
            entitlement: entitlement_id || entitlement_ids?.[0]
        });

        const relevantEntitlements = entitlement_ids || (entitlement_id ? [entitlement_id] : []);
        const isProRelated = relevantEntitlements.some(id => 
            id === ENTITLEMENT_PRO_ANNUAL || 
            id === ENTITLEMENT_PRO_MONTHLY || 
            id === ENTITLEMENT_PRO_LEGACY ||
            id === 'pro'
        );

        if (!isProRelated && (type === 'INITIAL_PURCHASE' || type === 'RENEWAL')) {
            return reply.code(200).send({ success: true });
        }

        const adminClient = getAdminClient();
        const activeEntitlement = entitlement_id || (entitlement_ids && entitlement_ids[0]) || '';
        const prodId = product_id?.toLowerCase() || '';
        
        const isAnnual = activeEntitlement === ENTITLEMENT_PRO_ANNUAL || prodId.includes('annual');
        const targetQuota = isAnnual ? QUOTA_ANNUAL : QUOTA_MONTHLY;

        try {
            switch (type) {
                case 'INITIAL_PURCHASE':
                case 'RENEWAL':
                case 'UNCANCELLATION':
                case 'NON_RENEWING_PURCHASE':
                    fastify.log.info(`[RevenueCat] Granting ${isAnnual ? 'Annual (Daily 10)' : 'Monthly (Monthly 100)'} Pro access to user: ${app_user_id}`);
                    await adminClient
                        .from('users')
                        .update({ generation_limit: targetQuota })
                        .eq('id', app_user_id);
                    break;

                case 'EXPIRATION':
                case 'UNSUBSCRIBE':
                    fastify.log.info(`[RevenueCat] Revoking Pro access. Resetting to Free (1 per 48h) for: ${app_user_id}`);
                    await adminClient
                        .from('users')
                        .update({ generation_limit: QUOTA_FREE })
                        .eq('id', app_user_id);
                    break;

                case 'CANCELLATION':
                    fastify.log.info(`[RevenueCat] Cancellation recorded for ${app_user_id}. Access remains.`);
                    break;

                default:
                    break;
            }
        } catch (err) {
            fastify.log.error({ err, msg: '[RevenueCat] Error processing webhook' });
            return reply.code(500).send({ error: 'Internal processing error' });
        }

        return reply.code(200).send({ success: true });
    });
}
