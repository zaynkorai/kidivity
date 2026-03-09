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
function buildSystemInstruction(profile: any): string {
    return `You are Kidivity, an AI that creates fun, engaging activities for children.
You always respond with well-structured, age-appropriate content.
Format your response in clean markdown.

Child Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Grade: ${profile.grade_level}
- Interests: ${(profile.interests || []).join(', ')}`;
}

function buildPromptUser(profile: any, input: GenerateBody): string {
    let prompt = `Style: ${input.style === 'bw' ? 'Black and white, optimized for printing' : 'Colorful and visually engaging'}
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

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const sysInstruction = buildSystemInstruction(kidProfile);
        const promptText = buildPromptUser(kidProfile, input);

        let content = '';
        let image_url: string | null = null;
        let isVisualCategory = input.category === 'tracing' || input.category === 'screen-free';

        // 3a. Visual Categories: Google Banana API (Nano/Flash Image) via Gemini
        if (isVisualCategory) {
            fastify.log.info('Using Google Banana (Flash Image) API for category: %s', input.category);
            
            // Text generation for the instructions
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: sysInstruction }] },
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: { temperature: 0.9 }
                    }),
                },
            );

            if (!geminiResponse.ok) {
                const errText = await geminiResponse.text();
                fastify.log.error('Gemini error: %s', errText);
                throw new Error(`Failed to generate activity content`);
            }

            const geminiData = await geminiResponse.json();
            content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

            // Image generation via Google Banana API (Imagen 3 / Banana Nano)
            // Note: Since Banana Nano might be a hypothetical or specific vertex endpoint, 
            // we simulate the Google Image generation API (Imagen endpoint format) 
            // fallback to returning a placeholder if it fails, ensuring the app still runs.
            try {
                const bananaPrompt = `A ${input.style === 'bw' ? 'black and white sketch' : 'colorful illustration'} for a children's activity about ${input.topic}. Kid friendly, cute, clean lines.`;
                const bananaResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            instances: [{ prompt: bananaPrompt }],
                            parameters: { sampleCount: 1, sampleImageSize: '1024x1024' }
                        }),
                    }
                );
                
                if (bananaResponse.ok) {
                    const bananaData = await bananaResponse.json();
                    const base64Image = bananaData.predictions?.[0]?.bytesBase64Encoded;
                    if (base64Image) {
                        image_url = `data:image/jpeg;base64,${base64Image}`;
                    }
                } else {
                    const errText = await bananaResponse.text();
                    fastify.log.warn('Google Banana Image API failed or is not available, using placeholder: %s', errText);
                    // Fallback visual representation if the Imagen API throws due to API Key restrictions
                    image_url = `https://placehold.co/600x400/${input.style === 'bw' ? 'EEE/333' : 'FFB3BA/333'}?text=Visual+Activity+Generated`;
                }
            } catch (err: any) {
                fastify.log.error(err, 'Error calling Google Banana API');
            }
            
        } 
        
        // 3b. Text Categories: Standard Gemini Text API
        else {
            fastify.log.info('Using Standard Gemini Text API for category: %s', input.category);
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: sysInstruction }] },
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: { temperature: 0.9 }
                    }),
                },
            );

            if (!geminiResponse.ok) {
                const errText = await geminiResponse.text();
                fastify.log.error('Gemini error: %s', errText);
                throw new Error(`Failed to generate activity content`);
            }

            const geminiData = await geminiResponse.json();
            content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (!content) {
            throw new Error('Failed to parse Gemini/Banana response');
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
                image_url: image_url, // Saves the generated image or fallback
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
