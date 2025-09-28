"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { generateIconAction } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, WandSparkles, Download } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const formSchema = z.object({
  concept: z.string().min(10, {
    message: "Please describe your icon concept in at least 10 characters.",
  }).max(500, {
    message: "Concept must not exceed 500 characters."
  }),
});

type GeneratedIcon = {
  url: string;
};

export default function IconMaker() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('logoMaker');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concept: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setGeneratedIcons([]);
    try {
      const result = await generateIconAction(values.concept);
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.imageUrls) {
        setGeneratedIcons(result.imageUrls.map(url => ({ url })));
        toast({ title: "Icons Generated!", description: "Your new icon concepts are ready." });
        
        router.refresh();
      }
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

  const downloadIcon = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `icon-concept-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 grid gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Describe Your Icon</CardTitle>
          <CardDescription>Be as descriptive as possible for the best results. Mention colors, styles, and objects.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="concept"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Icon Concept</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'A minimalist icon for a coffee shop called ''Aroma'', using a simple coffee bean and steam, in brown and white colors.'"
                        className="min-h-[120px] resize-y text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                    Generating Icons...
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-5 w-5" />
                    Generate Icons
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {(isLoading || generatedIcons.length > 0) && (
        <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle>Your Icon Concepts</CardTitle>
            <CardDescription>Here are three unique concepts based on your description. Download your favorite!</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4 flex items-center justify-center aspect-square">
                    <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ))
            ) : (
              generatedIcons.map((icon, index) => (
                <Card key={index} className="overflow-hidden group">
                  <CardContent className="p-4 space-y-4">
                    <div className="relative aspect-square w-full rounded-md overflow-hidden border bg-muted/20 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3C/svg%3E')]">
                      <Image src={icon.url} alt={`Generated Icon ${index + 1}`} layout="fill" objectFit="contain" />
                    </div>
                    <Button onClick={() => downloadIcon(icon.url, index)} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Icon (512x512)
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
