
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BlockMath } from 'react-katex';

import { solveMathProblemAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const formSchema = z.object({
  problem: z.string().min(3, {
    message: "Please enter a math problem.",
  }).max(1000, {
    message: "Problem must not exceed 1000 characters."
  }),
});

type SolutionStep = {
  explanation: string;
  formula: string;
};

type Solution = {
  steps: SolutionStep[];
  finalAnswer: string;
};

export default function MathSolver() {
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<Solution | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('aiMath');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problem: "",
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
    setSolution(null);
    try {
      const result = await solveMathProblemAction(values.problem);
      if ('error' in result) {
        throw new Error(result.error);
      }
      setSolution(result as Solution);
      
      router.refresh();

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Solving Failed",
        description: "There was an issue solving the math problem. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mt-8 grid gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Enter Your Math Problem</CardTitle>
            <CardDescription>You can use plain text or LaTeX for formulas (e.g., `\\int_0^1 x^2 dx`).</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="problem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Math Problem</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="For example: 'Find the roots of the quadratic equation x^2 - 3x + 2 = 0' or 'What is the derivative of f(x) = sin(x^2)?'"
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
                      Solving...
                    </>
                  ) : (
                    <>
                      <WandSparkles className="mr-2 h-5 w-5" />
                      Solve Problem
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {isLoading && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Solution</CardTitle>
              <CardDescription>The AI is working on your problem...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                </div>
            </CardContent>
          </Card>
        )}

        {solution && (
          <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
              <CardTitle>Step-by-Step Solution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {solution.steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <p className="font-semibold">Step {index + 1}:</p>
                  <p>{step.explanation}</p>
                  {step.formula && (
                    <div className="rounded-md bg-muted/50 p-4 overflow-x-auto">
                      <BlockMath math={step.formula} />
                    </div>
                  )}
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                  <p className="font-semibold text-lg">Final Answer:</p>
                  <div className="rounded-md bg-primary/10 p-4 text-center">
                      <BlockMath math={solution.finalAnswer} />
                  </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

    