
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
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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
    const prompts = [
      `You are a professional product photographer. Your task is to generate an additional product image that visually communicates the item’s features more effectively by showcasing it from a different angle (e.g., side, top-down). 
       Product Name: ${productName}
       ${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}
       Maintain consistent lighting, background, and styling to match the original visual. Ensure the image is fully compliant with the product's official specifications. The output must be in webp format with a transparent background.`,
      `You are a professional product photographer. Your task is to generate an additional product image that shows the product in a real-life application or context. 
       Product Name: ${productName}
       ${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}
       The image should look realistic and appealing, helping customers visualize how they would use the product. Maintain brand consistency in styling. The output must be in webp format.`,
      `You are a professional product photographer. Your task is to generate a product image that highlights a specific feature or includes a size/color variation, if applicable.
       Product Name: ${productName}
       ${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}
       If no specific features are mentioned, create a visually interesting lifestyle shot with the product. Ensure the image is fully compliant with the product's official specifications. The output must be in webp format.`
    ];

    const generationPromises = prompts.map((prompt) =>
      ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          {media: {url: productImage}},
          { text: prompt },
        ],
      }).catch(err => {
        console.warn('An image generation failed:', err);
        return null; // Return null on failure instead of throwing
      })
    );

    const results = await Promise.all(generationPromises);

    const imageUrls = results
      .map(result => result?.media?.url)
      .filter((url): url is string => !!url); // Filter out nulls and undefined URLs

    // We no longer throw an error if some images fail. 
    // We just return the ones that succeeded.

    return {
      imageUrls,
    };
  }
);
