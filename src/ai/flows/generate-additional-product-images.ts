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
    
    const {output} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: productImage}},
        {
          text: `You are a professional product photographer.
          
Product Name: ${productName}
${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}

Generate 3 high-quality 1080x1080 images of this product suitable for a website.
Showcase the product from different angles or in different lifestyle settings that highlight its features and use cases.
Maintain a consistent style and lighting across all images. The output format should be webp.`,
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
      output: {
        format: 'media',
        media: {
          image: {
            imageFormat: 'WEBP'
          }
        }
      }
    });

    if (!output || output.length === 0) {
      throw new Error('Image generation failed to produce any images.');
    }
    
    const imageUrls = output.map(o => o.media.url);

    return {
      imageUrls,
    };
  }
);
