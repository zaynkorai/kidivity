import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { FastifyBaseLogger } from 'fastify';

interface GenerateActivityParams {
    geminiKey: string;
    sysInstruction: string;
    promptText: string;
    buildImagePrompt?: (dynamicPrompt: string) => string;
    isVisualCategory: boolean;
    logger: FastifyBaseLogger;
}

interface GenerateResult {
    content: string;
    image_url: string | null;
}

// Define the schema for text responses exactly as requested
const activityResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    instructions: { type: Type.STRING },
    content: { type: Type.STRING },
    imagePrompt: { type: Type.STRING, description: "A detailed prompt for generating an image that perfectly matches the activity content." },
  },
  required: ["title", "instructions", "content", "imagePrompt"],
};

export async function generateActivityContent({
    geminiKey,
    sysInstruction,
    promptText,
    buildImagePrompt,
    isVisualCategory,
    logger
}: GenerateActivityParams): Promise<GenerateResult> {
    
    // Create an instance leveraging the provided API key
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // 1. Generate Text First
    let markdown = '';
    let dynamicImagePrompt = '';
    
    try {
        const res = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: promptText,
            config: {
                systemInstruction: sysInstruction,
                responseMimeType: "application/json",
                responseSchema: activityResponseSchema,
            },
        });
        
        const text = res.text;
        if (!text) throw new Error("No text returned from Gemini");
        
        // Strip markdown block formatting if Gemini included it despite application/json mimetype
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        let parsed: any;
        try {
            parsed = JSON.parse(cleanText);
        } catch (parseErr) {
            logger.error({ err: parseErr, cleanText }, 'Gemini returned invalid JSON');
            throw new Error('AI returned an unexpected format. Please try again.');
        }

        markdown = `# ${parsed.title}\n\n${parsed.instructions}\n\n${parsed.content}`;
        dynamicImagePrompt = parsed.imagePrompt;
    } catch (err: any) {
        logger.error(err, 'Gemini text error');
        throw new Error(err.message || 'Unknown error generating activity');
    }

    // 2. Generate Image (Sequential)
    let image_url: string | null = null;

    if (isVisualCategory && buildImagePrompt && dynamicImagePrompt) {
        try {
            const finalImagePrompt = buildImagePrompt(dynamicImagePrompt);
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: finalImagePrompt }],
                }
            });
            for (const part of res.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    image_url = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }
        } catch (err: any) {
            logger.error(err, 'Error calling image generation API');
            // We don't throw here to still return the content even if image fails
        }
    }

    return { content: markdown, image_url };
}
