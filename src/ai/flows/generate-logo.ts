'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating logo variations based on a text concept.
 *
 * It exports:
 * - `generateLogo`: An async function that takes a logo concept and returns three logo variations.
 * - `GenerateLogoInput`: The input type for the `generateLogo` function.
 * - `GenerateLogoOutput`: The output type for the `generateLogo` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateLogoInputSchema = z.object({
  concept: z.string().describe('The concept or idea for the logo.'),
});
export type GenerateLogoInput = z.infer<typeof GenerateLogoInputSchema>;

const GenerateLogoOutputSchema = z.object({
  imageUrls: z
    .array(z.string())
    .describe('The data URIs of the generated logo images in 512x512 PNG format.'),
});
export type GenerateLogoOutput = z.infer<typeof GenerateLogoOutputSchema>;

export async function generateLogo(
  input: GenerateLogoInput
): Promise<GenerateLogoOutput> {
  return generateLogoFlow(input);
}

const generateLogoFlow = ai.defineFlow(
  {
    name: 'generateLogoFlow',
    inputSchema: GenerateLogoInputSchema,
    outputSchema: GenerateLogoOutputSchema,
  },
  async ({ concept }) => {
    const basePrompt = `Create a modern, clean, and professional logo concept for: "${concept}". 
    The logo must be on a transparent background.
    The final image must be a 512x512 pixel PNG.
    The style should be minimalist and easily recognizable.
    Do not include any text unless explicitly asked for in the concept.`;

    // Generate 3 variations in parallel
    const generations = await Promise.all(
      [1, 2, 3].map(() =>
        ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: `${basePrompt} Generate a unique variation.`,
        })
      )
    );

    const imageUrls = generations.map(({ media }) => {
      if (!media || !media.url) {
        throw new Error('An image generation failed to produce a logo.');
      }
      return media.url;
    });

    if (imageUrls.length < 3) {
      throw new Error('Logo generation failed to produce all 3 variations.');
    }

    return {
      imageUrls,
    };
  }
);
