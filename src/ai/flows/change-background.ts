'use server';

/**
 * @fileOverview Defines a Genkit flow for changing the background of an image.
 *
 * It exports:
 * - `changeBackground`: An async function that takes an image data URI and a color.
 * - `ChangeBackgroundInput`: The input type for the `changeBackground` function.
 * - `ChangeBackgroundOutput`: The output type for the `changeBackground` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChangeBackgroundInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be edited, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  backgroundColor: z.string().describe('The hex color code for the new background (e.g., #FFFFFF).')
});
export type ChangeBackgroundInput = z.infer<typeof ChangeBackgroundInputSchema>;

const ChangeBackgroundOutputSchema = z.object({
  imageDataUri: z.string().describe('The edited image as a data URI.'),
});
export type ChangeBackgroundOutput = z.infer<typeof ChangeBackgroundOutputSchema>;

export async function changeBackground(
  input: ChangeBackgroundInput
): Promise<ChangeBackgroundOutput> {
  return changeBackgroundFlow(input);
}

const changeBackgroundFlow = ai.defineFlow(
  {
    name: 'changeBackgroundFlow',
    inputSchema: ChangeBackgroundInputSchema,
    outputSchema: ChangeBackgroundOutputSchema,
  },
  async ({ imageDataUri, backgroundColor }) => {
    let promptText = `Change the background of the image to a solid color with the hex code ${backgroundColor}. The subject of the image should be cleanly isolated.`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        { media: { url: imageDataUri } },
        { text: promptText },
      ],
    });

    if (!media || !media.url) {
      throw new Error('Image editing failed to produce an image.');
    }
    
    return {
      imageDataUri: media.url,
    };
  }
);
