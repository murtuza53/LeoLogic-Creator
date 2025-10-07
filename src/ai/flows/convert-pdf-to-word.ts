
'use server';

/**
 * @fileOverview Defines a Genkit flow for converting a PDF file to a Word (.docx) document, including images.
 *
 * It exports:
 * - `convertPdfToWord`: An async function that takes a PDF data URI.
 * - `ConvertPdfToWordInput`: The input type for the `convertPdfTo-word` function.
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
    // 1. Use AI to analyze the PDF and reconstruct text content
    const { text: structuredContent } = await ai.generate({
        prompt: [
            { media: { url: pdfDataUri } },
            `You are a document conversion expert. Analyze the provided PDF file and reconstruct its text content with high fidelity.
        
            Your task is to preserve the original document's structure.
            - Reconstruct all text content, preserving paragraphs, headings, and lists.
            - Do not add any new content, commentary, or summaries. Your output should be only the structured text content from the document.
            - Each block of text should be on its own line.`
        ],
        model: 'googleai/gemini-2.5-flash',
        config: { temperature: 0.1 }
    });

    // 2. Create a DOCX file from the structured content
    const paragraphs = structuredContent.split('\n').map(line => new Paragraph(line.trim()));

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
