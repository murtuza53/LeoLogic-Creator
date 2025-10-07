
'use server';

/**
 * @fileOverview Defines a Genkit flow for converting a PDF file to a Word (.docx) document.
 *
 * It exports:
 * - `convertPdfToWord`: An async function that takes a PDF data URI.
 * - `ConvertPdfToWordInput`: The input type for the `convertPdfToWord` function.
 * - `ConvertPdfToWordOutput`: The output type for the `convertPdfToWord` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph } from 'docx';

const ConvertPdfToWordInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file to be converted, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ConvertPdfToWordInput = z.infer<typeof ConvertPdfToWordInputSchema>;

const ConvertPdfToWordOutputSchema = z.object({
  docxDataUri: z
    .string()
    .describe('The converted Word document as a data URI.'),
});
export type ConvertPdfToWordOutput = z.infer<
  typeof ConvertPdfToWordOutputSchema
>;

export async function convertPdfToWord(
  input: ConvertPdfToWordInput
): Promise<ConvertPdfToWordOutput> {
  return convertPdfToWordFlow(input);
}

const convertPdfToWordFlow = ai.defineFlow(
  {
    name: 'convertPdfToWordFlow',
    inputSchema: ConvertPdfToWordInputSchema,
    outputSchema: ConvertPdfToWordOutputSchema,
  },
  async ({ pdfDataUri }) => {
    // 1. Use AI to analyze the PDF and re-structure the text
    // The multimodal model can visually interpret the PDF structure.
    const { text: structuredText } = await ai.generate({
        prompt: `You are a document conversion expert. Analyze the provided PDF file and reconstruct its text content with high fidelity.
        
        Your task is to preserve the original document's structure, including paragraphs, headings, and lists. Do not add any new content, commentary, or summaries. Your output should be only the structured text from the document.
        
        PDF File:
        ---
        {{media url=pdfDataUri}}
        ---`,
        model: 'googleai/gemini-2.5-flash',
        config: { temperature: 0.1 }
    });

    // 2. Create a DOCX file from the structured text
    const paragraphs = structuredText.split('\n').map(p => new Paragraph(p.trim()));

    const doc = new Document({
      sections: [{
        children: paragraphs,
      }],
    });

    // 3. Pack the document into a buffer
    const docxBuffer = await Packer.toBuffer(doc);
    const docxDataUri = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuffer.toString('base64')}`;
    
    return {
      docxDataUri,
    };
  }
);
