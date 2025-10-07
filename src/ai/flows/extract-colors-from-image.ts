
'use server';

/**
 * @fileOverview Defines a Genkit flow for extracting a color palette from an image.
 *
 * It exports:
 * - `extractColorsFromImage`: An async function that takes an image data URI.
 * - `ExtractColorsFromImageInput`: The input type for the function.
 * - `ExtractColorsFromImageOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractColorsFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to extract colors from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractColorsFromImageInput = z.infer<
  typeof ExtractColorsFromImageInputSchema
>;

const ExtractColorsFromImageOutputSchema = z.object({
  colors: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
    .describe('An array of dominant colors from the image, in HEX format.'),
});
export type ExtractColorsFromImageOutput = z.infer<
  typeof ExtractColorsFromImageOutputSchema
>;

export async function extractColorsFromImage(
  input: ExtractColorsFromImageInput
): Promise<ExtractColorsFromImageOutput> {
  return extractColorsFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractColorsPrompt',
  input: { schema: ExtractColorsFromImageInputSchema },
  output: { schema: ExtractColorsFromImageOutputSchema },
  prompt: `You are a color expert. Analyze the provided image and extract the 5 most dominant and visually representative colors.
  
  Return the colors as an array of HEX codes.
  
  Image: {{media url=imageDataUri}}`,
});

const extractColorsFromImageFlow = ai.defineFlow(
  {
    name: 'extractColorsFromImageFlow',
    inputSchema: ExtractColorsFromImageInputSchema,
    outputSchema: ExtractColorsFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
