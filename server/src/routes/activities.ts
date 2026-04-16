import type { FastifyInstance } from 'fastify';
import { getUserClient, getAdminClient } from '../lib/supabase.js';
import { checkQuota } from '../utils/quotas.js';
import { generateSchema, GenerateBody } from '../schemas/activity.schema.js';
import { buildSystemInstruction, buildPromptUser, buildImagePrompt } from '../services/prompt.service.js';
import { generateActivityContent } from '../services/ai.service.js';
import { ActivityService } from '../services/activity.service.js';
import type { ImageSpec } from '../types/image-spec.js';

// ── Route ───────────────────────────────────────────────
export default async function activityRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: GenerateBody }>('/api/activities/generate', async (request, reply) => {
        const parsed = generateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid request data' });
        }

        const input = parsed.data;
        const timezone = (request.headers['x-timezone'] as string) || 'UTC';

        // 2. Check per-user daily quota and Reserve
        const adminClient = getAdminClient();
        const quota = await checkQuota(adminClient, request.userId, timezone);
        if (!quota.allowed) {
            return reply.code(429).send({
                error: 'Out of Magic Sparks for today',
                used: quota.used,
                limit: quota.limit,
                reset_at: quota.reset_at,
            });
        }

        // 3. ATOMIC RESERVATION: Insert placeholder activity first
        const supabase = getUserClient(request.accessToken);
        const { data: placeholder, error: reserveError } = await supabase
            .from('activities')
            .insert({
                user_id: request.userId,
                kid_profile_id: input.kid_profile_id,
                category: input.category,
                topic: input.topic,
                difficulty: input.difficulty,
                style: input.style,
                status: 'generating',
                content: 'Generating activity...', // Temporary content
            })
            .select()
            .single();

        if (reserveError || !placeholder) {
            fastify.log.error('Reservation error: %o', reserveError);
            throw new Error('Failed to reserve activity quota');
        }

        try {
            // 4. Fetch kid profile (RLS ensures ownership)
            const { data: kidProfile, error: profileError } = await supabase
                .from('kid_profiles')
                .select('*')
                .eq('id', input.kid_profile_id)
                .single();

            if (profileError || !kidProfile) {
                // Refund quota if profile not found
                await adminClient.from('activities').delete().eq('id', placeholder.id);
                return reply.code(403).send({ error: 'Profile not found' });
            }

            // 5. Build AI prompts and background context...
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
            if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured');

            const sysInstruction = buildSystemInstruction(kidProfile, feedbackStrings);
            const promptText = buildPromptUser(kidProfile, input);
            const buildImagePromptFn = (spec: ImageSpec) => buildImagePrompt(kidProfile, input, spec);
            
            const simpleCategories = ['tracing', 'math', 'reading'];
            const model = simpleCategories.includes(input.category) ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

            // 6. Generate content
            const { content, image_url } = await generateActivityContent({
                geminiKey,
                sysInstruction,
                promptText,
                model,
                buildImagePrompt: buildImagePromptFn,
                isVisualCategory: true,
                logger: fastify.log
            });

            // 7. Success: Finalize activity
            const { data: activity, error: updateError } = await adminClient
                .from('activities')
                .update({
                    content,
                    image_url,
                    status: 'completed'
                })
                .eq('id', placeholder.id)
                .select()
                .single();

            if (updateError) throw updateError;
            return activity;

        } catch (err: any) {
            fastify.log.error('Generation execution failed: %s', err.message);
            // 8. Failure: Mark as failed so it doesn't count against quota or delete it
            await adminClient
                .from('activities')
                .update({ status: 'failed' })
                .eq('id', placeholder.id);
            
            return reply.code(500).send({ error: 'Failed to generate activity. Please try again.' });
        }
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

    fastify.get('/api/activities/quota', async (request) => {
        const adminClient = getAdminClient();
        const timezone = (request.headers['x-timezone'] as string) || 'UTC';
        return checkQuota(adminClient, request.userId, timezone);
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
