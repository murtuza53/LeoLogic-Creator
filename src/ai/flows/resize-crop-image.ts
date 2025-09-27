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
You are an expert image editor. Your task is to process the given image to create a perfect square WebP image with the dimensions ${targetSize}x${targetSize} pixels.

1. **Isolate the subject** and make the background transparent.
2. **Force the image to be resized** to *exactly* ${targetSize}x${targetSize} pixels. It is critical that the final dimensions are a perfect square. Do not maintain the original aspect ratio; stretch the image as needed to fit the square canvas.
3. The final image **must** be in WebP format with a transparent background.
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
