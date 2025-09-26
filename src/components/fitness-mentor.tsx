"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fitnessMentorAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LoaderCircle, Send, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import ReactMarkdown from 'react-markdown';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const formSchema = z.object({
  message: z.string().min(1, {
    message: "Please enter a message.",
  }),
});

type Message = {
  role: 'user' | 'bot';
  content: string;
};

export default function FitnessMentor() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! I'm your AI Fitness Mentor. Ask me anything about health, workouts, or nutrition. How can I help you today?" }
  ]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('fitnessMentor');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;

    const userMessage: Message = { role: 'user', content: values.message };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    form.reset();

    try {
      const result = await fitnessMentorAction(values.message);
      if ('error' in result) {
        throw new Error(result.error);
      }
      const botMessage: Message = { role: 'bot', content: result.response };
      setMessages(prev => [...prev, botMessage]);
      incrementUsage();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "There was an issue with the chatbot. Please try again.",
      });
      setMessages(prev => prev.slice(0, -1)); // Remove the user's message on error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col h-[60vh]">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'bot' && (
                    <Avatar className='border'>
                      <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-md rounded-xl px-4 py-3 text-sm shadow-sm",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <ReactMarkdown className="prose dark:prose-invert">
                        {message.content}
                    </ReactMarkdown>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className='border'>
                      <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className='border'>
                      <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="max-w-md rounded-xl px-4 py-3 text-sm shadow-sm bg-muted flex items-center">
                        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-3">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormControl>
                        <Input placeholder="Ask a fitness question..." {...field} autoComplete="off" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
