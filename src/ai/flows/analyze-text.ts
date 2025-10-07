
'use server';

/**
 * @fileOverview Defines a Genkit flow for analyzing text content.
 *
 * It exports:
 * - `analyzeText`: An async function that takes a string of text.
 * - `AnalyzeTextInput`: The input type for the `analyzeText` function.
 * - `AnalyzeTextOutput`: The output type for the `analyzeText` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeTextInputSchema = z.object({
  text: z.string().describe('The text content to be analyzed.'),
});
export type AnalyzeTextInput = z.infer<typeof AnalyzeTextInputSchema>;

const AnalyzeTextOutputSchema = z.object({
  clarityScore: z.number().min(0).max(10).describe('A score from 0-10 representing the clarity and conciseness of the text.'),
  clarityFeedback: z.string().describe('Specific feedback on how to improve clarity.'),
  tone: z.string().describe('The perceived tone of the text (e.g., Formal, Casual, Optimistic).'),
  toneFeedback: z.string().describe('Feedback on the appropriateness of the tone.'),
  overallImpression: z.string().describe('A brief, overall impression of the text quality.'),
  suggestions: z.array(z.string()).describe('A list of actionable suggestions for improvement.'),
});
export type AnalyzeTextOutput = z.infer<typeof AnalyzeTextOutputSchema>;

export async function analyzeText(input: AnalyzeTextInput): Promise<AnalyzeTextOutput> {
  return analyzeTextFlow(input);
}

const analyzeTextPrompt = ai.definePrompt({
  name: 'analyzeTextPrompt',
  input: { schema: AnalyzeTextInputSchema },
  output: { schema: AnalyzeTextOutputSchema },
  prompt: `You are an expert editor and writing coach. Analyze the following text based on several criteria.

Text to analyze:
"""
{{{text}}}
"""

**Your Task:**

1.  **Clarity Score (0-10):** Rate the text on how clear and easy it is to understand. 10 is perfectly clear.
2.  **Clarity Feedback:** Provide specific reasons for the clarity score. Mention things like sentence structure, jargon, and conciseness.
3.  **Tone Analysis:** Identify the primary tone of the text (e.g., Formal, Informal, Joyful, Serious, Optimistic).
4.  **Tone Feedback:** Comment on the effectiveness of this tone for a general audience.
5.  **Overall Impression:** Give a one-sentence summary of the text's quality.
6.  **Actionable Suggestions:** Provide a list of 2-3 concrete suggestions the author can implement to improve the text.

Provide your analysis in the required JSON format.`,
});

const analyzeTextFlow = ai.defineFlow(
  {
    name: 'analyzeTextFlow',
    inputSchema: AnalyzeTextInputSchema,
    outputSchema: AnalyzeTextOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeTextPrompt(input);
    return output!;
  }
);
