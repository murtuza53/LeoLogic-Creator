
'use server';

/**
 * @fileOverview Defines a Genkit flow for converting an image to an ICO file.
 *
 * It exports:
 * - `convertImageToIco`: An async function that takes an image data URI.
 * - `ConvertImageToIcoInput`: The input type for the `convertImageToIco` function.
 * - `ConvertImageToIcoOutput`: The output type for the `convertImageToIco` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PNG } from 'pngjs';
import toIco from 'to-ico';

const ConvertImageToIcoInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be converted, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ConvertImageToIcoInput = z.infer<typeof ConvertImageToIcoInputSchema>;

const ConvertImageToIcoOutputSchema = z.object({
  icoDataUri: z.string().describe('The converted image as an ICO data URI.'),
});
export type ConvertImageToIcoOutput = z.infer<typeof ConvertImageToIcoOutputSchema>;

export async function convertImageToIco(
  input: ConvertImageToIcoInput
): Promise<ConvertImageToIcoOutput> {
  return convertImageToIcoFlow(input);
}

const convertImageToIcoFlow = ai.defineFlow(
  {
    name: 'convertImageToIcoFlow',
    inputSchema: ConvertImageToIcoInputSchema,
    outputSchema: ConvertImageToIcoOutputSchema,
  },
  async ({ imageDataUri }) => {
    const sizes = [16, 24, 32, 48, 64];

    const imageGenerationPromises = sizes.map(size => 
      ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { media: { url: imageDataUri } },
          { text: `Resize this image to be exactly ${size}x${size} pixels. It is critical that the final dimensions are a perfect square. Do not maintain the original aspect ratio; stretch or crop the image as needed to fit the square canvas. The final image must be in PNG format with a transparent background.` },
        ],
      })
    );

    const results = await Promise.all(imageGenerationPromises);

    const imageBuffers = await Promise.all(results.map(async ({ media }) => {
        if (!media || !media.url) {
            throw new Error('Image generation failed for one of the icon sizes.');
        }
        const base64 = media.url.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        // We need to decode and re-encode to ensure it's a valid PNG buffer for the `to-ico` library
        const png = PNG.sync.read(buffer);
        return PNG.sync.write(png);
    }));

    const icoBuffer = await toIco(imageBuffers);
    const icoDataUri = `data:image/x-icon;base64,${icoBuffer.toString('base64')}`;

    return {
      icoDataUri,
    };
  }
);
