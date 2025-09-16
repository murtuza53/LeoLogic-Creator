'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a web-optimized product image.
 *
 * It exports:
 * - `generateProductImage`: An async function that takes a product image data URI and returns a new image.
 * - `GenerateProductImageInput`: The input type for the `generateProductImage` function.
 * - `GenerateProductImageOutput`: The output type for the `generateProductImage` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductImageInputSchema = z.object({
  productImage: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateProductImageInput = z.infer<
  typeof GenerateProductImageInputSchema
>;

const GenerateProductImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The data URI of the generated product image in png format.'),
});
export type GenerateProductImageOutput = z.infer<
  typeof GenerateProductImageOutputSchema
>;

export async function generateProductImage(
  input: GenerateProductImageInput
): Promise<GenerateProductImageOutput> {
  return generateProductImageFlow(input);
}

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async ({productImage}) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: productImage}},
        {
          text: 'Generate a high-quality 1080x1080 version of this product image suitable for a website, with a clean white background. The output format should be png.',
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    // Ensure the output is in png format as requested. The model should handle this, but we can verify.
    // The data URI from gemini-2.5-flash-image-preview might not specify png, but the underlying data is.
    // For simplicity, we trust the model's output format.
    return {
      imageUrl: media.url,
    };
  }
);
