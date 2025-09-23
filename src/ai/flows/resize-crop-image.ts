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
      You are an expert image editor. Your task is to process an image according to the following steps, ensuring the final output is a perfect square of ${targetSize}x${targetSize} pixels.

      1.  **Convert to PNG:** Convert the provided image to PNG format to ensure transparency is supported.
      2.  **Isolate Subject:** Remove the background from the image, making it transparent.
      3.  **Resize to Fit:** Resize the isolated subject so that its largest dimension (either width or height) fits within a ${targetSize}x${targetSize} canvas while maintaining its original aspect ratio.
      4.  **Place on Canvas:** Center the resized subject onto a new, transparent ${targetSize}x${targetSize} pixel canvas. Do not crop the subject. If the subject is not square, there will be transparent space on two sides (top/bottom or left/right).
      5.  **Output:** Provide the final image as a PNG with a transparent background.
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
