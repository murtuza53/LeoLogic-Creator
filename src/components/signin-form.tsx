"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth, initiateEmailSignIn } from '@/firebase';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function SigninForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      // Non-blocking call to initiate sign-in
      initiateEmailSignIn(auth, values.email, values.password);

      // A more robust implementation would use onAuthStateChanged listener to confirm login
      // and handle errors. For simplicity, we'll optimistically show a toast and redirect.
      // Firebase's non-blocking functions handle the error cases via the global error emitter.

      setTimeout(() => {
         const user = auth.currentUser;
         if (user) {
            toast({
              title: "Signed In!",
              description: "Welcome back!",
            });
            router.push('/');
         } else {
             // Error will be caught by the global handler, but we can provide fallback feedback
             toast({
                variant: "destructive",
                title: "Sign-in Failed",
                description: "Please check your email and password.",
             });
         }
         setIsLoading(false);
      }, 2000); // Wait for auth state to propagate

    } catch (error: any) {
        console.error('Sign-in error:', error);
        toast({
            variant: "destructive",
            title: "Sign-in Failed",
            description: error.message || "An unknown error occurred. Please try again.",
        });
        setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
