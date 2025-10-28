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
