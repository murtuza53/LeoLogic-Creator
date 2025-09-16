// src/ai/flows/generate-product-specifications.ts
'use server';

/**
 * @fileOverview Generates product specifications based on the product name and image.
 *
 * - generateProductSpecifications - A function that generates product specifications.
 * - GenerateProductSpecificationsInput - The input type for the generateProductSpecifications function.
 * - GenerateProductSpecificationsOutput - The return type for the generateProductSpecifications function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductSpecificationsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productImage: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateProductSpecificationsInput = z.infer<
  typeof GenerateProductSpecificationsInputSchema
>;

const GenerateProductSpecificationsOutputSchema = z.object({
  specifications: z.array(
    z.object({
      name: z.string().describe('The name of the specification (e.g., "Material", "Dimensions").'),
      value: z.string().describe('The value of the specification (e.g., "Leather", "10x20x30 cm").'),
    })
  ).describe('The generated specifications for the product as an array of name-value pairs.'),
});
export type GenerateProductSpecificationsOutput = z.infer<
  typeof GenerateProductSpecificationsOutputSchema
>;

export async function generateProductSpecifications(
  input: GenerateProductSpecificationsInput
): Promise<GenerateProductSpecificationsOutput> {
  return generateProductSpecificationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductSpecificationsPrompt',
  input: { schema: GenerateProductSpecificationsInputSchema },
  output: { schema: GenerateProductSpecificationsOutputSchema },
  prompt: `You are an expert in product specifications.

  Based on the product name and the image, generate detailed specifications for the product in a structured format.
  Consider the type of product when determining the appropriate specifications to include.
  Each specification should be a key-value pair.

  Product Name: {{{productName}}}
  Product Image: {{media url=productImage}}`,
});

const generateProductSpecificationsFlow = ai.defineFlow(
  {
    name: 'generateProductSpecificationsFlow',
    inputSchema: GenerateProductSpecificationsInputSchema,
    outputSchema: GenerateProductSpecificationsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
