'use server';

/**
 * @fileOverview Defines a Genkit flow for compressing a PDF file.
 *
 * It exports:
 * - `compressPdf`: An async function that takes a PDF data URI and a compression level.
 * - `CompressPdfInput`: The input type for the `compressPdf` function.
 * - `CompressPdfOutput`: The output type for the `compressPdf` function.
 */

import { ai } from '@/ai/genkit';
import { PDFDocument } from 'pdf-lib';
import { z } from 'genkit';

const CompressionLevelSchema = z.enum(['low', 'medium', 'high']);

const CompressPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file to be compressed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  compressionLevel: CompressionLevelSchema.describe(
    'The desired level of compression.'
  ),
});
export type CompressPdfInput = z.infer<typeof CompressPdfInputSchema>;

const CompressPdfOutputSchema = z.object({
  compressedPdfDataUri: z
    .string()
    .describe('The compressed PDF file as a data URI.'),
  originalSize: z.number().describe('The original file size in bytes.'),
  compressedSize: z.number().describe('The compressed file size in bytes.'),
});
export type CompressPdfOutput = z.infer<typeof CompressPdfOutputSchema>;

export async function compressPdf(
  input: CompressPdfInput
): Promise<CompressPdfOutput> {
  return compressPdfFlow(input);
}

const compressPdfFlow = ai.defineFlow(
  {
    name: 'compressPdfFlow',
    inputSchema: CompressPdfInputSchema,
    outputSchema: CompressPdfOutputSchema,
  },
  async ({ pdfDataUri, compressionLevel }) => {
    const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
    const originalSize = pdfBytes.length;

    const pdfDoc = await PDFDocument.load(pdfBytes, { 
        // Parsing options can be adjusted here if needed
        // For example, ignoring parsing errors for corrupt documents
        ignoreEncryption: true,
     });

    // The compression logic with pdf-lib is mostly about how the document is saved.
    // Higher levels might involve more aggressive options if the library supported them
    // (e.g., image re-compression, font subsetting).
    // Here, we simulate different levels by toggling object stream usage.
    // 'low' and 'medium' will use object streams, which generally helps compression.
    // 'high' will do the same but in a real-world scenario you might add more steps.
    const useObjectStreams = compressionLevel !== 'low';

    const compressedPdfBytes = await pdfDoc.save({ useObjectStreams });
    const compressedSize = compressedPdfBytes.length;
    
    const compressedPdfDataUri = `data:application/pdf;base64,${Buffer.from(compressedPdfBytes).toString('base64')}`;

    return {
      compressedPdfDataUri,
      originalSize,
      compressedSize,
    };
  }
);
