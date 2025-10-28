"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactMarkdown from 'react-markdown';

import { generateBlogPostAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, WandSparkles, Clipboard, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const formSchema = z.object({
  topic: z.string().min(5, {
    message: "Please describe your topic in at least 5 characters.",
  }).max(200, {
    message: "Topic must not exceed 200 characters."
  }),
  outline: z.string().max(1000, {
    message: "Outline must not exceed 1000 characters."
  }).optional(),
});

type BlogPost = {
  content: string;
};

export default function AIBlogWriter() {
  const [isLoading, setIsLoading] = useState(false);
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('aiBlogWriter');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      outline: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUserLoading) {
      toast({ description: "Verifying user status..." });
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setBlogPost(null);
    try {
      const result = await generateBlogPostAction(values.topic, values.outline);
      if ('error' in result) {
        throw new Error(result.error);
      }
      setBlogPost(result as BlogPost);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    if (!blogPost?.content) return;
    navigator.clipboard.writeText(blogPost.content).then(() => {
        setCopied(true);
        toast({ title: 'Blog post copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-8 grid gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Blog Post Details</CardTitle>
          <CardDescription>Provide a topic and an optional outline to guide the AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic / Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Future of Renewable Energy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="outline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outline or Keywords (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Introduction to solar power, advances in wind turbines, challenges in battery storage..."
                        className="min-h-[120px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide keywords or a simple outline to structure the article.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-5 w-5" />
                    Generate Blog Post
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {(isLoading || blogPost) && (
        <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader className='flex-row items-center justify-between'>
            <div>
                <CardTitle>Generated Blog Post</CardTitle>
                <CardDescription>Here is the AI-generated content for your blog.</CardDescription>
            </div>
            {blogPost && (
                <Button variant="outline" onClick={handleCopy}>
                    {copied ? <ClipboardCheck className='mr-2' /> : <Clipboard className='mr-2'/>}
                    Copy
                </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : blogPost && (
              <div className="prose dark:prose-invert max-w-none rounded-md border p-6 bg-muted/20">
                <ReactMarkdown>{blogPost.content}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
