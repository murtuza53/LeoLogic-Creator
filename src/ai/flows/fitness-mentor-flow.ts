
'use server';

/**
 * @fileOverview Defines a Genkit flow for a fitness and health chatbot.
 *
 * It exports:
 * - `fitnessMentorFlow`: An async function that takes a user's message.
 * - `FitnessMentorInput`: The input type for the `fitnessMentorFlow` function.
 * - `FitnessMentorOutput`: The output type for the `fitnessMentorFlow` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FitnessMentorInputSchema = z.object({
  message: z.string().describe('The user\'s question or message to the fitness mentor.'),
});
export type FitnessMentorInput = z.infer<typeof FitnessMentorInputSchema>;

const FitnessMentorOutputSchema = z.object({
  response: z.string().describe('The AI mentor\'s response.'),
});
export type FitnessMentorOutput = z.infer<typeof FitnessMentorOutputSchema>;

export async function fitnessMentor(
  input: FitnessMentorInput
): Promise<FitnessMentorOutput> {
  return fitnessMentorFlow(input);
}

const fitnessMentorFlow = ai.defineFlow(
  {
    name: 'fitnessMentorFlow',
    inputSchema: FitnessMentorInputSchema,
    outputSchema: FitnessMentorOutputSchema,
  },
  async ({ message }) => {
    const { text } = await ai.generate({
        prompt: `You are a knowledgeable and encouraging fitness and health mentor. Your goal is to provide safe, helpful, and motivating advice. Do not give medical advice. If a question is outside the scope of general fitness, nutrition, and wellness, gently decline to answer and suggest consulting a professional.

        User's question: "${message}"`,
        model: 'googleai/gemini-2.5-flash',
        config: {
            temperature: 0.7,
        }
    });

    return {
      response: text,
    };
  }
);
