import type { FastifyInstance } from 'fastify';
import { getUserClient, getAdminClient } from '../lib/supabase.js';
import { checkQuota } from '../utils/quotas.js';
import { generateSchema, GenerateBody } from '../schemas/activity.schema.js';
import { buildSystemInstruction, buildPromptUser, buildImagePrompt } from '../services/prompt.service.js';
import { generateActivityContent } from '../services/ai.service.js';
import { ActivityService } from '../services/activity.service.js';

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

        // 3b. Fetch recent feedback for personalization
        const { data: recentFeedback } = await supabase
            .from('activities')
            .select('category, topic, rating, feedback_text')
            .eq('kid_profile_id', input.kid_profile_id)
            .neq('rating', 0)
            .order('created_at', { ascending: false })
            .limit(5);

        const feedbackStrings = (recentFeedback || []).map(f => {
            const sentiment = f.rating === 1 ? 'LIKED' : 'DISLIKED';
            let str = `${sentiment}: ${f.category} activity about "${f.topic}"`;
            if (f.feedback_text) str += ` (Reason: ${f.feedback_text})`;
            return str;
        });

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const sysInstruction = buildSystemInstruction(kidProfile, feedbackStrings);
        const promptText = buildPromptUser(kidProfile, input);
        const buildImagePromptFn = (dynOp: string) => buildImagePrompt(kidProfile, input, dynOp);
        
        const isVisualCategory = true;

        // Select model based on category complexity
        const simpleCategories = ['tracing', 'math', 'reading'];
        const model = simpleCategories.includes(input.category) 
            ? 'gemini-2.5-flash' 
            : 'gemini-2.5-pro';

        // 4. Generate content and then image sequentially via ai.service
        const { content, image_url } = await generateActivityContent({
            geminiKey,
            sysInstruction,
            promptText,
            model,
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

    fastify.post<{ Params: { id: string }; Body: { rating: number; feedback_text?: string } }>('/api/activities/:id/feedback', async (request, reply) => {
        const { id } = request.params;
        const supabase = getUserClient(request.accessToken);

        const { data, error } = await supabase
            .from('activities')
            .update({
                rating: request.body.rating,
                feedback_text: request.body.feedback_text
            })
            .eq('id', id)
            .eq('user_id', request.userId)
            .select()
            .single();

        if (error || !data) {
            fastify.log.error('Feedback update error: %o', error);
            return reply.code(404).send({ error: 'Activity not found or update failed' });
        }

        return data;
    });

    // Optimized listing routes for egress reduction
    fastify.get('/api/activities', async (request) => {
        const supabase = getUserClient(request.accessToken);
        const activityService = new ActivityService(supabase);
        return activityService.getRecentActivities();
    });

    fastify.get('/api/activities/saved', async (request) => {
        const supabase = getUserClient(request.accessToken);
        const activityService = new ActivityService(supabase);
        return activityService.getSavedActivities();
    });

    fastify.get<{ Params: { id: string } }>('/api/activities/:id', async (request, reply) => {
        const { id } = request.params;
        const supabase = getUserClient(request.accessToken);
        const activityService = new ActivityService(supabase);

        try {
            const data = await activityService.getActivityDetail(id, request.userId);
            if (!data) return reply.code(404).send({ error: 'Activity not found' });
            return data;
        } catch (error: any) {
            fastify.log.error('Failed to fetch activity detail: %o', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
