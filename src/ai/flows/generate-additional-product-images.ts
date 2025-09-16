'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating additional web-optimized product images.
 *
 * It exports:
 * - `generateAdditionalProductImages`: An async function that takes a product image data URI and returns new images.
 * - `GenerateAdditionalProductImagesInput`: The input type for the `generateAdditionalProductImages` function.
 * - `GenerateAdditionalProductImagesOutput`: The output type for the `generateAdditionalProductImages` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAdditionalProductImagesInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productImage: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  additionalInfo: z.string().optional().describe('Additional information about the product.'),
});
export type GenerateAdditionalProductImagesInput = z.infer<
  typeof GenerateAdditionalProductImagesInputSchema
>;

const GenerateAdditionalProductImagesOutputSchema = z.object({
  imageUrls: z
    .array(z.string())
    .describe('The data URIs of the generated product images in webp format.'),
});
export type GenerateAdditionalProductImagesOutput = z.infer<
  typeof GenerateAdditionalProductImagesOutputSchema
>;

export async function generateAdditionalProductImages(
  input: GenerateAdditionalProductImagesInput
): Promise<GenerateAdditionalProductImagesOutput> {
  return generateAdditionalProductImagesFlow(input);
}

const generateAdditionalProductImagesFlow = ai.defineFlow(
  {
    name: 'generateAdditionalProductImagesFlow',
    inputSchema: GenerateAdditionalProductImagesInputSchema,
    outputSchema: GenerateAdditionalProductImagesOutputSchema,
  },
  async ({productName, productImage, additionalInfo}) => {
    const generations = await Promise.all(
      Array.from({length: 3}, () =>
        ai.generate({
          model: 'googleai/gemini-2.5-flash-image-preview',
          prompt: [
            {media: {url: productImage}},
            {
              text: `You are a professional product photographer. Your task is to generate an additional product image that visually communicates the item’s features more effectively.

Product Name: ${productName}
${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}

Your generated image should:
- Showcase the product from a different angle (e.g., front, side, top-down).
- If applicable to the product, include variations in size or color.
- Remain fully compliant with the product’s official specifications and design guidelines based on the provided image.
- Maintain consistent lighting, background, and styling to match the original visual.

Generate a high-quality 1080x1080 image in PNG format.`,
            },
          ],
        })
      )
    );

    const imageUrls = generations.map(({media}) => {
      if (!media || !media.url) {
        throw new Error('An image generation failed to produce an image.');
      }
      return media.url;
    });

    if (imageUrls.length === 0) {
      throw new Error('Image generation failed to produce any images.');
    }

    return {
      imageUrls,
    };
  }
);
