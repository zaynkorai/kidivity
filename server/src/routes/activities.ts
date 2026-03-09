import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getUserClient } from '../lib/supabase.js';

// ── Validation ──────────────────────────────────────────
const generateSchema = z.object({
    kid_profile_id: z.string().uuid(),
    category: z.enum(['logic', 'tracing', 'educational', 'screen-free']),
    topic: z.string().min(1).max(100),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    style: z.enum(['bw', 'colorful']),
});

type GenerateBody = z.infer<typeof generateSchema>;

// ── Prompt builders ─────────────────────────────────────
function buildPrompt(profile: any, input: GenerateBody): string {
    let prompt = `You are Kidivity, an AI that creates fun, educational activities for children.
You always respond with well-structured, age-appropriate content.
Format your response in clean markdown.

Child Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Grade: ${profile.grade_level}
- Interests: ${(profile.interests || []).join(', ')}

Style: ${input.style === 'bw' ? 'Black and white, optimized for printing' : 'Colorful and visually engaging'}
Difficulty: ${input.difficulty}

`;

    switch (input.category) {
        case 'logic':
            prompt += `Create a ${input.difficulty} logic puzzle about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include: the puzzle, clear instructions, and the answer key at the bottom. Types: pattern recognition, sequencing, matching, simple deduction.`;
            break;
        case 'tracing':
            prompt += `Create a ${input.difficulty} tracing/writing activity about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include: letters or shapes to trace, dotted guidelines, and a fun illustration description. Describe the layout so it can be hand-drawn or generated as an image.`;
            break;
        case 'educational':
            prompt += `Create a ${input.difficulty} educational activity about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include: 3-5 fun facts, a short reading passage, and a mini quiz (3 questions). Make it engaging and spark curiosity.`;
            break;
        case 'screen-free':
            prompt += `Create a ${input.difficulty} screen-free activity about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include: materials needed (common household items only), step-by-step instructions, and learning outcomes. Should take 15-30 minutes.`;
            break;
        default:
            prompt += `Create a fun activity about "${input.topic}".`;
    }

    return prompt;
}

// ── Route ───────────────────────────────────────────────
export default async function activityRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: GenerateBody }>('/api/activities/generate', async (request, reply) => {
        // 1. Validate input
        const parsed = generateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: 'Invalid request data',
                details: parsed.error.errors,
            });
        }

        const input = parsed.data;
        const supabase = getUserClient(request.accessToken);

        // 2. Fetch kid profile (RLS ensures ownership)
        const { data: kidProfile, error: profileError } = await supabase
            .from('kid_profiles')
            .select('*')
            .eq('id', input.kid_profile_id)
            .single();

        if (profileError || !kidProfile) {
            return reply.code(403).send({ error: 'Profile not found' });
        }

        // 3. Build prompt & call Gemini
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const prompt = buildPrompt(kidProfile, input);

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            },
        );

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            fastify.log.error('Gemini error: %s', errText);
            throw new Error(`Failed to generate activity content`);
        }

        const geminiData = await geminiResponse.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error('Failed to parse Gemini response');
        }

        // 4. Save to database
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
                image_url: null,
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
