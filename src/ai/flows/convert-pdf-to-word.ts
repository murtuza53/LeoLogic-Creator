
'use server';

/**
 * @fileOverview Defines a Genkit flow for converting a PDF file to a Word (.docx) document, including images.
 *
 * It exports:
 * - `convertPdfToWord`: An async function that takes a PDF data URI.
 * - `ConvertPdfToWordInput`: The input type for the `convertPdfToWord` function.
 * - `ConvertPdfToWordOutput`: The output type for the `convertPdfToWord` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, ImageRun } from 'docx';

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
    // 1. Load the PDF and extract images
    const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    
    const imagePromises = pdfDoc.getPages().map(async (page, pageIndex) => {
        const imageJpgs = await page.extractImages();
        return Promise.all(Object.values(imageJpgs).map(async (image) => {
            const buffer = await image.embed();
            return {
                buffer: buffer.buffer, // Get ArrayBuffer
                dataUri: `data:image/jpeg;base64,${Buffer.from(buffer.buffer).toString('base64')}`
            };
        }));
    });

    const pageImages = await Promise.all(imagePromises);
    const allImages = pageImages.flat();

    // 2. Use AI to analyze the PDF and reconstruct text and image placement
    const promptParts: (string | { media: { url: string } })[] = [
        { media: { url: pdfDataUri } },
        `You are a document conversion expert. Analyze the provided PDF file and reconstruct its content with high fidelity.
        
        Your task is to preserve the original document's structure, including text and images.
        - Reconstruct all text content, preserving paragraphs, headings, and lists.
        - Where an image appears in the document, insert a placeholder tag like \`{{{image_0}}}\`, \`{{{image_1}}}\`, etc., corresponding to the images provided.
        - Do not add any new content, commentary, or summaries. Your output should be only the structured content from the document.
        - Each block of text and each image placeholder should be on its own line.

        Here are the images extracted from the PDF, in order of appearance:
        `
    ];

    allImages.forEach((img, index) => {
        promptParts.push(`Image ${index}: {{{image_${index}}}}`);
        promptParts.push({ media: { url: img.dataUri } });
    });

    const { text: structuredContent } = await ai.generate({
        prompt: promptParts.join('\n'),
        model: 'googleai/gemini-2.5-flash',
        config: { temperature: 0.1 }
    });

    // 3. Create a DOCX file from the structured content
    const children = await Promise.all(structuredContent.split('\n').map(async (line) => {
      const trimmedLine = line.trim();
      const imageMatch = trimmedLine.match(/^{{{image_(\d+)}}}$/);
      
      if (imageMatch) {
        const imageIndex = parseInt(imageMatch[1], 10);
        if (imageIndex < allImages.length) {
          const image = allImages[imageIndex];
          return new Paragraph({
            children: [
              new ImageRun({
                data: image.buffer,
                transformation: {
                  width: 500, // Fixed width, height will be calculated based on aspect ratio
                  height: 500, // Placeholder, will be adjusted by aspect ratio
                },
              }),
            ],
          });
        }
      }
      
      return new Paragraph(trimmedLine);
    }));

    const doc = new Document({
      sections: [{
        children,
      }],
    });

    // 4. Pack the document into a buffer
    const docxBuffer = await Packer.toBuffer(doc);
    const docxDataUri = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuffer.toString('base64')}`;
    
    return {
      docxDataUri,
    };
  }
);
