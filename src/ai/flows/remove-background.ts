'use server';

/**
 * @fileOverview Defines a Genkit flow for removing the background from an image.
 *
 * It exports:
 * - `removeBackground`: An async function that takes an image data URI.
 * - `RemoveBackgroundInput`: The input type for the `removeBackground` function.
 * - `RemoveBackgroundOutput`: The output type for the `removeBackground` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RemoveBackgroundInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be edited, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
  imageDataUri: z.string().describe('The edited image with a transparent background as a data URI.'),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

export async function removeBackground(
  input: RemoveBackgroundInput
): Promise<RemoveBackgroundOutput> {
  return removeBackgroundFlow(input);
}

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: RemoveBackgroundInputSchema,
    outputSchema: RemoveBackgroundOutputSchema,
  },
  async ({ imageDataUri }) => {
    const promptText = `
You are an expert image editor. Your task is to accurately isolate the main subject of the image and make the background transparent.

1.  **Identify the main subject.** This could be a person, object, or animal.
2.  **Create a clean mask** around the subject, paying close attention to details like hair or fine edges.
3.  **Remove the background entirely**, leaving a transparent PNG. The final output must have a transparent background.
    `;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: imageDataUri } },
        { text: promptText },
      ],
    });

    if (!media || !media.url) {
      throw new Error('Background removal failed to produce an image.');
    }
    
    return {
      imageDataUri: media.url,
    };
  }
);
