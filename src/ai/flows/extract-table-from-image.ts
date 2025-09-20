'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting tabular data from an image.
 *
 * It exports:
 * - `extractTableFromImage`: An async function that takes an image data URI and returns structured tabular data.
 * - `ExtractTableFromImageInput`: The input type for the `extractTableFromImage` function.
 * - `ExtractTableFromImageOutput`: The output type for the `extractTableFromImage` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CellStyleSchema = z.object({
  bold: z.boolean().optional().describe('Whether the text is bold.'),
  italic: z.boolean().optional().describe('Whether the text is italic.'),
  textColor: z.string().optional().describe('The hex color of the text (e.g., #FF0000).'),
  backgroundColor: z.string().optional().describe('The hex color of the cell background (e.g., #00FF00).'),
});

const CellSchema = z.object({
  value: z.string().describe('The text content of the cell.'),
  style: CellStyleSchema.optional().describe('The styling of the cell.'),
});

const RowSchema = z.object({
  cells: z.array(CellSchema).describe('The cells in this row.'),
});

const ExtractTableFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a document or table, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTableFromImageInput = z.infer<
  typeof ExtractTableFromImageInputSchema
>;

const ExtractTableFromImageOutputSchema = z.object({
  rows: z.array(RowSchema).describe('The rows of data extracted from the table.'),
  hasData: z.boolean().describe('Whether any tabular data was found in the image.')
});
export type ExtractTableFromImageOutput = z.infer<
  typeof ExtractTableFromImageOutputSchema
>;

export async function extractTableFromImage(
  input: ExtractTableFromImageInput
): Promise<ExtractTableFromImageOutput> {
  return extractTableFromImageFlow(input);
}

const extractTablePrompt = ai.definePrompt({
  name: 'extractTablePrompt',
  input: { schema: ExtractTableFromImageInputSchema },
  output: { schema: ExtractTableFromImageOutputSchema },
  prompt: `You are an expert data entry specialist with an emphasis on accuracy. Your task is to analyze the provided image, identify any tables, and extract the data with perfect fidelity.

  **Instructions:**
  
  1.  **Table Detection:**
      - Scan the image to locate any tabular structures.
      - If no table is found, set the 'hasData' flag to false and return an empty 'rows' array.
  
  2.  **Data Extraction:**
      - Extract the text from each cell in the table.
      - Preserve the original language and characters exactly as they appear.
      - Maintain the correct row and column structure.
  
  3.  **Style Preservation:**
      - For each cell, detect its styling.
      - **Bold/Italic:** Note if the text is bold or italic.
      - **Colors:** Identify the text color and the cell's background color. Provide these as standard hex codes (e.g., #FFFFFF).
  
  4.  **Output Formatting:**
      - Structure the output according to the provided JSON schema.
      - Each object in the 'rows' array represents a table row.
      - Each row object contains an array of 'cells'.
      - Each cell object has a 'value' and an optional 'style' object.
  
  Image to process: {{media url=imageDataUri}}`,
});

const extractTableFromImageFlow = ai.defineFlow(
  {
    name: 'extractTableFromImageFlow',
    inputSchema: ExtractTableFromImageInputSchema,
    outputSchema: ExtractTableFromImageOutputSchema,
  },
  async input => {
    const { output } = await extractTablePrompt(input);
    return output!;
  }
);
