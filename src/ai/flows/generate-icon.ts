'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating icon variations based on a text concept and optional image.
 *
 * It exports:
 * - `generateIcon`: An async function that takes a concept and returns three icon variations.
 * - `GenerateIconInput`: The input type for the `generateIcon` function.
 * - `GenerateIconOutput`: The output type for the `generateIcon` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateIconInputSchema = z.object({
  concept: z.string().describe('The concept or idea for the icon.'),
  image: z.string().optional().describe('An optional reference image as a data URI.'),
});
export type GenerateIconInput = z.infer<typeof GenerateIconInputSchema>;

export const GenerateIconOutputSchema = z.object({
  imageUrls: z
    .array(z.string())
    .describe('The data URIs of the generated icon images in 512x512 PNG format.'),
});
export type GenerateIconOutput = z.infer<typeof GenerateIconOutputSchema>;

export async function generateIcon(
  input: GenerateIconInput
): Promise<GenerateIconOutput> {
  return generateIconFlow(input);
}

const generateIconFlow = ai.defineFlow(
  {
    name: 'generateIconFlow',
    inputSchema: GenerateIconInputSchema,
    outputSchema: GenerateIconOutputSchema,
  },
  async ({ concept, image }) => {
    
    let prompt: (string | { media: { url: string; }; })[] = [
        `Create a high-quality, full-color, professional icon based on the following concept: "${concept}".
        The icon must be on a transparent background.
        The final image must be a 512x512 pixel PNG.
        The style should be modern, clean, and easily recognizable.
        Do not include any text unless explicitly asked for in the concept.`
    ];

    if (image) {
      prompt.push({ media: { url: image } });
      prompt[0] += "\nUse the provided image as a strong reference for the style, subject, and color palette."
    }

    // Generate 3 variations in parallel
    const generations = await Promise.all(
      [1, 2, 3].map(() =>
        ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: `${prompt[0]} Generate a unique variation.`,
        })
      )
    );

    const imageUrls = generations.map(({ media }) => {
      if (!media || !media.url) {
        throw new Error('An image generation failed to produce an icon.');
      }
      return media.url;
    });

    if (imageUrls.length < 3) {
      throw new Error('Icon generation failed to produce all 3 variations.');
    }

    return {
      imageUrls,
    };
  }
);
