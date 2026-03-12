import type { FastifyInstance } from 'fastify';
import { getUserClient, getAdminClient } from '../lib/supabase.js';
import { checkQuota } from '../utils/quotas.js';
import { generateSchema, GenerateBody } from '../schemas/activity.schema.js';
import { buildSystemInstruction, buildPromptUser, buildImagePrompt } from '../services/prompt.service.js';
import { generateActivityContent } from '../services/ai.service.js';

// ── Route ───────────────────────────────────────────────
export default async function activityRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: GenerateBody }>('/api/activities/generate', async (request, reply) => {
        const parsed = generateSchema.safeParse(request.body);
        if (!parsed.success) {
            const logPayload =
                process.env.NODE_ENV === 'production'
                    ? { errors: parsed.error.errors, bodyKeys: Object.keys(request.body ?? {}) }
                    : { errors: parsed.error.errors, body: request.body };
            fastify.log.error(logPayload, 'Validation failed');
            return reply.code(400).send({
                error: 'Invalid request data',
                details: parsed.error.errors,
            });
        }

        const input = parsed.data;

        // 2. Check per-user daily quota
        const adminClient = getAdminClient();
        const quota = await checkQuota(adminClient, request.userId);
        if (!quota.allowed) {
            return reply.code(429).send({
                error: 'Daily generation limit reached',
                used: quota.used,
                limit: quota.limit,
                reset_at: quota.reset_at,
            });
        }

        // 3. Fetch kid profile (RLS ensures ownership)
        const supabase = getUserClient(request.accessToken);
        const { data: kidProfile, error: profileError } = await supabase
            .from('kid_profiles')
            .select('*')
            .eq('id', input.kid_profile_id)
            .single();

        if (profileError || !kidProfile) {
            return reply.code(403).send({ error: 'Profile not found' });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const sysInstruction = buildSystemInstruction(kidProfile);
        const promptText = buildPromptUser(kidProfile, input);
        const buildImagePromptFn = (dynOp: string) => buildImagePrompt(kidProfile, input, dynOp);
        
        // ALL activities are now visual-first
        const isVisualCategory = true;

        // 4. Generate content and then image sequentially via ai.service
        const { content, image_url } = await generateActivityContent({
            geminiKey,
            sysInstruction,
            promptText,
            buildImagePrompt: buildImagePromptFn,
            isVisualCategory,
            logger: fastify.log
        });

        // 5. Save to database
        const { data: activity, error: insertError } = await supabase
            .from('activities')
            .insert({
                user_id: request.userId,
                kid_profile_id: input.kid_profile_id,
                category: input.category,
                topic: input.topic,
                difficulty: input.difficulty,
                style: input.style,
                content,
                image_url,
            })
            .select()
            .single();

        if (insertError) {
            fastify.log.error('Insert error: %o', insertError);
            throw new Error('Failed to save activity to database');
        }

        return activity;
    });
}
