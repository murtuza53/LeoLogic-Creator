'use server';

/**
 * @fileOverview Defines a Genkit flow for converting an image to WebP format with optional background modifications.
 *
 * It exports:
 * - `convertImageToWebp`: An async function that takes an image data URI and conversion options.
 * - `ConvertImageToWebpInput`: The input type for the `convertImageToWebp` function.
 * - `ConvertImageToWebpOutput`: The output type for the `convertImageToWebp` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConvertImageToWebpInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be converted, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  removeBackground: z.boolean().optional().describe('Whether to make the background transparent.'),
  backgroundColor: z.string().optional().describe('A hex color code to set as the new background (e.g., #FF0000). This is ignored if removeBackground is true.'),
});
export type ConvertImageToWebpInput = z.infer<typeof ConvertImageToWebpInputSchema>;

const ConvertImageToWebpOutputSchema = z.object({
  webpDataUri: z.string().describe('The converted image as a WebP data URI.'),
});
export type ConvertImageToWebpOutput = z.infer<typeof ConvertImageToWebpOutputSchema>;

export async function convertImageToWebp(
  input: ConvertImageToWebpInput
): Promise<ConvertImageToWebpOutput> {
  return convertImageToWebpFlow(input);
}

const convertImageToWebpFlow = ai.defineFlow(
  {
    name: 'convertImageToWebpFlow',
    inputSchema: ConvertImageToWebpInputSchema,
    outputSchema: ConvertImageToWebpOutputSchema,
  },
  async ({ imageDataUri, removeBackground, backgroundColor }) => {
    let promptText = 'Convert the provided image to WebP format.';

    if (removeBackground) {
        promptText += ' The background of the image should be removed and made transparent.';
    } else if (backgroundColor) {
        promptText += ` The existing background should be replaced with a solid color: ${backgroundColor}.`;
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: imageDataUri } },
        { text: promptText },
      ],
    });

    if (!media || !media.url) {
      throw new Error('Image conversion failed to produce an image.');
    }
    
    return {
      webpDataUri: media.url,
    };
  }
);
