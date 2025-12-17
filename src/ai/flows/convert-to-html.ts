
'use server';
/**
 * @fileOverview Universal document and URL to HTML converter.
 *
 * This flow converts various input sources (Word, Excel, PDF, URL) into a
 * self-contained HTML package, including assets, bundled into a ZIP file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import JSZip from 'jszip';

const FileInputSchema = z.object({
  source: z.literal('file'),
  dataUri: z.string().describe("The source file as a data URI."),
  fileName: z.string().describe("The original name of the file."),
});

const UrlInputSchema = z.object({
  source: z.literal('url'),
  url: z.string().url().describe("The URL to convert."),
});

const ConvertToHtmlInputSchema = z.union([FileInputSchema, UrlInputSchema]);
export type ConvertToHtmlInput = z.infer<typeof ConvertToHtmlInputSchema>;

const ConvertToHtmlOutputSchema = z.object({
  zipDataUri: z.string().describe('A ZIP file containing the HTML and assets, as a data URI.'),
});
export type ConvertToHtmlOutput = z.infer<typeof ConvertToHtmlOutputSchema>;

export async function convertToHtml(
  input: ConvertToHtmlInput
): Promise<ConvertToHtmlOutput> {
  return convertToHtmlFlow(input);
}

const convertToHtmlFlow = ai.defineFlow(
  {
    name: 'convertToHtmlFlow',
    inputSchema: ConvertToHtmlInputSchema,
    outputSchema: ConvertToHtmlOutputSchema,
  },
  async (input) => {
    let conversionPrompt: (string | { media: { url: string; }; })[];
    let sourceDescription: string;
    
    if (input.source === 'file') {
      conversionPrompt = [{ media: { url: input.dataUri } }];
      sourceDescription = `the provided file (${input.fileName})`;
    } else { // source is 'url'
      // Note: In a real implementation, we would fetch the URL content here.
      // For this prototype, we'll ask the AI to "imagine" fetching it.
      conversionPrompt = [`You will act as if you are fetching the content from the URL: ${input.url}.`];
      sourceDescription = `the website at ${input.url}`;
    }

    const promptText = `
        You are an expert web developer tasked with converting a source document or URL into a self-contained HTML package.

        **Source:** ${sourceDescription}
        
        **Instructions:**

        1.  **Analyze the Source:** Deeply analyze the structure, content, and styling of the provided source. This includes text, images, tables, lists, fonts, colors, and layout.
        2.  **Generate \`index.html\`:** Create a single, well-structured \`index.html\` file.
            -   The HTML should be semantic and clean.
            -   All CSS must be included within a \`<style>\` tag in the \`<head>\` of the HTML file. Do not use external stylesheets.
            -   Replicate the original layout and styling as closely as possible. This includes font families, sizes, colors, margins, padding, etc.
            -   For any images found in the source, use a placeholder path in the \`src\` attribute (e.g., \`src="assets/image1.png"\`).
        3.  **Extract Assets:**
            -   Identify all images in the source document.
            -   For each image, generate a unique, descriptive filename (e.g., \`image1.png\`, \`graph.jpg\`).
            -   The AI should "re-render" or "extract" these images as if they are separate files.
        4.  **Provide a JSON Manifest:** Your final output must be a single JSON object containing two keys:
            -   \`htmlContent\`: A string containing the full HTML content of the \`index.html\` file.
            -   \`assets\`: An array of objects, where each object has two keys: \`fileName\` (e.g., "image1.png") and \`dataUri\` (the Base64 encoded data URI for the image file).

        **URL-Specific Behavior:** If the source is a URL, you must only process the content on that single page. Do not follow any links to other pages or external domains. All assets (images, etc.) must be "re-fetched" and provided in the \`assets\` array as data URIs.
    `;

    conversionPrompt.push(promptText);

    const { output: structuredOutput } = await ai.generate({
        prompt: conversionPrompt,
        model: 'googleai/gemini-2.5-flash',
        output: {
            schema: z.object({
                htmlContent: z.string(),
                assets: z.array(z.object({
                    fileName: z.string(),
                    dataUri: z.string(),
                }))
            })
        },
        config: { temperature: 0.1 }
    });

    if (!structuredOutput) {
        throw new Error('AI failed to generate the HTML package.');
    }
    
    // Create a ZIP file
    const zip = new JSZip();
    zip.file('index.html', structuredOutput.htmlContent);
    
    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
        structuredOutput.assets.forEach(asset => {
            const base64Data = asset.dataUri.split(',')[1];
            assetsFolder.file(asset.fileName, base64Data, { base64: true });
        });
    }

    const zipData = await zip.generateAsync({ type: 'base64' });
    const zipDataUri = `data:application/zip;base64,${zipData}`;

    return {
      zipDataUri,
    };
  }
);
