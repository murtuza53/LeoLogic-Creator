
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
    // 1. Extract text from PDF using a more robust method
    const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    
    // We cannot reliably get structured text from pdf-lib. 
    // We will extract plain text and use AI to restructure it.
    // The library does not have a built-in text extraction method that preserves structure well.
    // A common workaround is to render to an image and use OCR, but here we will try a pure text approach.
    // Note: This approach will lose complex formatting like tables.
    
    let fullText = 'This is a best-effort text extraction. Formatting, tables, and images are not preserved.';

    // The 'pdf-lib' library does not have a direct, reliable text extraction method
    // like getTextContent(). The previous code was incorrect.
    // For a robust solution, one would typically use a library like 'pdf-parse' on the server,
    // but that's not available in this environment.
    // As a fallback, we'll inform the AI to work with the PDF content abstractly.
    // A more advanced solution would be to pass the PDF to a multimodal model.

    // 2. Use AI to analyze the PDF and re-structure the text
    const { text: structuredText } = await ai.generate({
        prompt: `You are a document structuring expert. Analyze the provided PDF file and reconstruct its text content. Preserve the original document's structure, including paragraphs, headings, and lists, as best as possible. Do not add any new content or commentary. Just return the structured text.
        
        PDF Content:
        ---
        {{media url=pdfDataUri}}
        ---`,
        model: 'googleai/gemini-2.5-flash',
        config: { temperature: 0.1 }
    });

    // 3. Create a DOCX file from the structured text
    const paragraphs = structuredText.split('\n').map(p => new Paragraph(p.trim()));

    const doc = new Document({
      sections: [{
        children: paragraphs,
      }],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    const docxDataUri = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuffer.toString('base64')}`;
    
    return {
      docxDataUri,
    };
  }
);
