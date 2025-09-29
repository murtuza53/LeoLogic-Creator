'use server';
/**
 * @fileOverview Solves a math problem and provides a step-by-step solution.
 *
 * - solveMathProblem - A function that solves a math problem.
 * - SolveMathProblemInput - The input type for the solveMathProblem function.
 * - SolveMathProblemOutput - The return type for the solveMathProblem function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SolveMathProblemInputSchema = z.object({
  problem: z.string().describe('The math problem to solve, which can be an equation or a word problem.'),
});
type SolveMathProblemInput = z.infer<typeof SolveMathProblemInputSchema>;

const SolveMathProblemOutputSchema = z.object({
  steps: z.array(
    z.object({
      explanation: z.string().describe('The explanation for this step of the solution.'),
      formula: z.string().describe('The LaTeX formula for this step.'),
    })
  ).describe('The step-by-step solution to the problem.'),
   finalAnswer: z.string().describe('The final answer in LaTeX format.'),
});
type SolveMathProblemOutput = z.infer<typeof SolveMathProblemOutputSchema>;

export async function solveMathProblem(
  input: SolveMathProblemInput
): Promise<SolveMathProblemOutput> {
  return solveMathProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveMathProblemPrompt',
  input: { schema: SolveMathProblemInputSchema },
  output: { schema: SolveMathProblemOutputSchema },
  prompt: `You are a world-class mathematician and expert educator.

  Your task is to solve the following math problem and provide a clear, step-by-step solution.
  For each step, provide both a natural language explanation and the corresponding mathematical formula in LaTeX format.
  If a step does not have a formula, you can provide an empty string.
  The final answer must also be in LaTeX format.

  Problem: {{{problem}}}
  `,
});

const solveMathProblemFlow = ai.defineFlow(
  {
    name: 'solveMathProblemFlow',
    inputSchema: SolveMathProblemInputSchema,
    outputSchema: SolveMathProblemOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
