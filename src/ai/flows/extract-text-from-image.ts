'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting text and its styling from an image.
 *
 * It exports:
 * - `extractTextFromImage`: An async function that takes an image data URI and returns the extracted text and styled HTML.
 * - `ExtractTextFromImageInput`: The input type for the `extractTextFromImage` function.
 * - `ExtractTextFromImageOutput`: The output type for the `extractTextFromImage` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractTextFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a document or text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromImageInput = z.infer<
  typeof ExtractTextFromImageInputSchema
>;

const ExtractTextFromImageOutputSchema = z.object({
  plainText: z
    .string()
    .describe('The clean, unformatted text extracted from the image.'),
  styledHtml: z
    .string()
    .describe(
      'An HTML string that accurately reconstructs the original document’s appearance, including fonts, colors, text styles (bold, italic), and layout.'
    ),
});
export type ExtractTextFromImageOutput = z.infer<
  typeof ExtractTextFromImageOutputSchema
>;

export async function extractTextFromImage(
  input: ExtractTextFromImageInput
): Promise<ExtractTextFromImageOutput> {
  return extractTextFromImageFlow(input);
}

const extractTextPrompt = ai.definePrompt({
  name: 'extractTextPrompt',
  input: { schema: ExtractTextFromImageInputSchema },
  output: { schema: ExtractTextFromImageOutputSchema },
  prompt: `You are an advanced Optical Character Recognition (OCR) AI. Your task is to analyze the provided image and extract its textual content with the highest possible fidelity to the original formatting.

  **Instructions:**
  
  1.  **Text Extraction:**
      - Detect and extract all visible text from the image, including headers, body content, lists, and footnotes.
      - Handle multiple languages, fonts, and varied layouts.
      - Accurately preserve line breaks, paragraph structure, and indentation in the plain text output.
  
  2.  **Style Reconstruction (for Styled HTML):**
      - **Font Matching:** Analyze the font families (e.g., serif, sans-serif, monospace) and apply the closest standard web font.
      - **Color Preservation:** Detect the color of the text and the background.
      - **Text Styling:** Faithfully reproduce bold, italic, underline, and other text decorations.
      - **Hierarchy and Alignment:** Maintain the document's structure, such as headings (h1, h2, etc.), and text alignment (left, center, right).
      - **Output:** Generate a single, self-contained HTML string with inline CSS to replicate the visual appearance.
  
  3.  **Output Generation:**
      - **plainText:** Provide the extracted text without any formatting.
      - **styledHtml:** Provide the reconstructed content as a single block of HTML with inline styles. Use a container div with a light gray background color. Ensure all styling is contained within this HTML.
  
  Image to process: {{media url=imageDataUri}}`,
});

const extractTextFromImageFlow = ai.defineFlow(
  {
    name: 'extractTextFromImageFlow',
    inputSchema: ExtractTextFromImageInputSchema,
    outputSchema: ExtractTextFromImageOutputSchema,
  },
  async input => {
    const { output } = await extractTextPrompt(input);
    return output!;
  }
);
