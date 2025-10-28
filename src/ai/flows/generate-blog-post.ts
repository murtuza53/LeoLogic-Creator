'use server';
/**
 * @fileOverview Generates a blog post from a topic and optional outline.
 *
 * It exports:
 * - `generateBlogPost`: An async function that takes a topic and an outline.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateBlogPostInput,
    GenerateBlogPostInputSchema,
    GenerateBlogPostOutput,
    GenerateBlogPostOutputSchema
} from '@/ai/schemas/blog-post-schemas';


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
