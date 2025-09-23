'use server';

/**
 * @fileOverview Defines a Genkit flow for removing the background, resizing, and cropping an image.
 *
 * It exports:
 * - `resizeAndCropImage`: An async function that takes an image data URI and a target size.
 * - `ResizeAndCropImageInput`: The input type for the `resizeAndCropImage` function.
 * - `ResizeAndCropImageOutput`: The output type for the `resizeAndCropImage` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ResizeAndCropImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be edited, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetSize: z.number().min(100).max(1000).describe('The target square size in pixels (e.g., 500).'),
});
export type ResizeAndCropImageInput = z.infer<typeof ResizeAndCropImageInputSchema>;

const ResizeAndCropImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The edited image as a data URI.'),
});
export type ResizeAndCropImageOutput = z.infer<typeof ResizeAndCropImageOutputSchema>;

export async function resizeAndCropImage(
  input: ResizeAndCropImageInput
): Promise<ResizeAndCropImageOutput> {
  return resizeAndCropImageFlow(input);
}

const resizeAndCropImageFlow = ai.defineFlow(
  {
    name: 'resizeAndCropImageFlow',
    inputSchema: ResizeAndCropImageInputSchema,
    outputSchema: ResizeAndCropImageOutputSchema,
  },
  async ({ imageDataUri, targetSize }) => {
    const promptText = `
      You are an expert image editor. Your task is to process an image to create a perfect ${targetSize}x${targetSize} pixel WebP image. 
      Follow these steps precisely:
      1.  Isolate the main subject and replace the background with solid white (#FFFFFF).
      2.  Resize the image so its shortest side matches the target size of ${targetSize} pixels, maintaining the aspect ratio.
      3.  Perform a center crop to ensure the final output is exactly ${targetSize}x${targetSize} pixels.
      4.  The final output must be in WebP format.
    `;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
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
