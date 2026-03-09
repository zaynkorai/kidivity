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

export async function generateActivityContent({
    geminiKey,
    sysInstruction,
    promptText,
    imagePrompt,
    isVisualCategory,
    logger
}: GenerateActivityParams): Promise<GenerateResult> {
    
    // 1. Define Text Generation Promise
    const textPromise = fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: sysInstruction }] },
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.85 },
            }),
        },
    ).then(async (res) => {
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini text error: ${errText}`);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    });

    // 2. Define Image Generation Promise (Optional)
    let imagePromise = Promise.resolve<string | null>(null);

    if (isVisualCategory && imagePrompt) {
        imagePromise = fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: imagePrompt }] }],
                }),
            },
        ).then(async (res) => {
            if (!res.ok) {
                const errText = await res.text();
                logger.warn('Image generation failed: %s', errText);
                return null;
            }
            const data = await res.json();
            const parts = data.candidates?.[0]?.content?.parts ?? [];
            const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
            if (imagePart?.inlineData?.data) {
                return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
            return null;
        }).catch((err) => {
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
