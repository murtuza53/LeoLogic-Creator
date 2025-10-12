
'use server';

/**
 * @fileOverview Defines a Genkit flow for resizing an image.
 *
 * It exports:
 * - `resizeImage`: An async function that takes an image data URI, dimensions, and aspect ratio preference.
 * - `ResizeImageInput`: The input type for the `resizeImage` function.
 * - `ResizeImageOutput`: The output type for the `resizeImage` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ResizeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be edited, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    width: z.number().min(1).max(2048).describe('The target width of the image in pixels.'),
    height: z.number().min(1).max(2048).describe('The target height of the image in pixels.'),
    maintainAspectRatio: z.boolean().describe('Whether to maintain the original aspect ratio.'),
});
export type ResizeImageInput = z.infer<typeof ResizeImageInputSchema>;

const ResizeImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The resized image as a data URI.'),
});
export type ResizeImageOutput = z.infer<typeof ResizeImageOutputSchema>;

export async function resizeImage(
  input: ResizeImageInput
): Promise<ResizeImageOutput> {
  return resizeImageFlow(input);
}

const resizeImageFlow = ai.defineFlow(
  {
    name: 'resizeImageFlow',
    inputSchema: ResizeImageInputSchema,
    outputSchema: ResizeImageOutputSchema,
  },
  async ({ imageDataUri, width, height, maintainAspectRatio }) => {
    let promptText: string;

    if (maintainAspectRatio) {
        promptText = `
        You are an expert image editor. Your task is to resize the given image to fit within a ${width}x${height} pixel bounding box while strictly maintaining its original aspect ratio.
        
        1. **Do not crop, stretch, or distort the image.**
        2. The final image dimensions must be less than or equal to ${width}px width and ${height}px height.
        3. The background of the final image must be transparent.
        4. The output must be in WebP format.
        `;
    } else {
        promptText = `
        You are an expert image editor. Your task is to resize the given image to the exact dimensions of ${width}x${height} pixels.
        
        1. **Stretch or distort the image as necessary** to meet the target dimensions of exactly ${width}x${height} pixels.
        2. Do not crop the image. The entire original image content must be present in the resized version.
        3. The background of the final image must be transparent.
        4. The output must be in WebP format.
        `;
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      prompt: [
        { media: { url: imageDataUri } },
        { text: promptText },
      ],
    });

    if (!media || !media.url) {
      throw new Error('Image resizing failed to produce an image.');
    }
    
    return {
      imageDataUri: media.url,
    };
  }
);
