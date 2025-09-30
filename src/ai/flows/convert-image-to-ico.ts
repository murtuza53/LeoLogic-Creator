
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
import sharp from 'sharp';
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
    // 1. Get a single high-quality square image from the AI
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        { media: { url: imageDataUri } },
        { text: 'Isolate the main subject of the image. Make the image a 256x256 pixel square, preserving the subject\'s aspect ratio by adding transparent padding if necessary. The final image must have a transparent background and be in PNG format.' },
      ],
    });

    if (!media || !media.url) {
      throw new Error('AI failed to generate the base image for the icon.');
    }

    const base64 = media.url.split(',')[1];
    const baseImageBuffer = Buffer.from(base64, 'base64');

    // 2. Use 'sharp' to create all the required sizes from the base image
    const sizes = [16, 24, 32, 48, 64, 128, 256];
    const imageBuffers = await Promise.all(
      sizes.map(size =>
        sharp(baseImageBuffer)
          .resize(size, size) // The base image is already square with transparency
          .png()
          .toBuffer()
      )
    );

    // 3. Use 'to-ico' to compile the final .ico file
    const icoBuffer = await toIco(imageBuffers);
    const icoDataUri = `data:image/x-icon;base64,${icoBuffer.toString('base64')}`;

    return {
      icoDataUri,
    };
  }
);
