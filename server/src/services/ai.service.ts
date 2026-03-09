import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { FastifyBaseLogger } from 'fastify';

interface GenerateActivityParams {
    geminiKey: string;
    sysInstruction: string;
    promptText: string;
    imagePrompt?: string;
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
  },
  required: ["title", "instructions", "content"],
};

export async function generateActivityContent({
    geminiKey,
    sysInstruction,
    promptText,
    imagePrompt,
    isVisualCategory,
    logger
}: GenerateActivityParams): Promise<GenerateResult> {
    
    // Create an instance leveraging the provided API key
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // 1. Define Text Generation Promise
    const textPromise = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText,
        config: {
            systemInstruction: sysInstruction,
            responseMimeType: "application/json",
            responseSchema: activityResponseSchema,
        },
    }).then(res => {
        const text = res.text;
        if (!text) throw new Error("No text returned from Gemini");
        return text;
    }).catch(err => {
        logger.error(err, 'Gemini text error');
        throw new Error(`Gemini text error: ${err.message}`);
    });

    // 2. Define Image Generation Promise (Optional)
    let imagePromise = Promise.resolve<string | null>(null);

    if (isVisualCategory && imagePrompt) {
        imagePromise = ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            }
        }).then(res => {
            for (const part of res.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            return null;
        }).catch((err: any) => {
            logger.error(err, 'Error calling image generation API');
            return null;
        });
    }

    // 3. Execute in parallel
    try {
        const [content, image_url] = await Promise.all([textPromise, imagePromise]);
        
        if (!content) {
            throw new Error('Failed to parse Gemini text response');
        }

        return { content, image_url };
    } catch (err: any) {
        logger.error(err, 'Error during activity generation');
        throw new Error('Failed to generate activity content');
    }
}
