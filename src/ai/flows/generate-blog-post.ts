'use server';
/**
 * @fileOverview Generates a blog post from a topic and optional outline.
 *
 * It exports:
 * - `generateBlogPost`: An async function that takes a topic and an outline.
 * - `GenerateBlogPostInput`: The input type for the function.
 * - `GenerateBlogPostOutput`: The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The main topic or title of the blog post.'),
  outline: z.string().optional().describe('An optional comma-separated list of keywords or a markdown outline for the blog post structure.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

export const GenerateBlogPostOutputSchema = z.object({
  content: z.string().describe('The generated blog post content in Markdown format.'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;


export async function generateBlogPost(input: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateBlogPostPrompt',
    input: { schema: GenerateBlogPostInputSchema },
    output: { schema: GenerateBlogPostOutputSchema },
    prompt: `You are an expert content creator and SEO specialist. Your task is to write a comprehensive, engaging, and well-structured blog post.

**Instructions:**

1.  **Topic:** Write a blog post about: \`{{{topic}}}\`
2.  **Structure & Keywords:** 
    {{#if outline}}
    Use the following outline or keywords to structure the content:
    \`\`\`
    {{{outline}}}
    \`\`\`
    {{else}}
    Create a logical structure for the blog post, including an introduction, several main body sections with subheadings, and a conclusion.
    {{/if}}
3.  **Content Style:**
    *   Write in a clear, conversational, and informative tone.
    *   Use headings, subheadings, bullet points, and bold text to improve readability.
    *   Incorporate relevant emojis to make the content more engaging. For example: 🚀, ✨, 💡, ✅.
    *   Ensure the content is SEO-friendly by naturally including relevant keywords.
4.  **Format:** The entire output must be a single string in Markdown format.

Begin the blog post now.
`,
});


const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
