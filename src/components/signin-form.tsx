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
import { useAuth, initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase';
import { Separator } from './ui/separator';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function SigninForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
      await initiateEmailSignIn(auth, values.email, values.password);
      toast({ title: "Signed In!", description: "Welcome back!" });
      router.push('/');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Sign-in Failed",
            description: error.message || "Please check your email and password.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      initiateGoogleSignIn(auth);
      // The user will be redirected. The result is handled on the landing page.
    } catch(error: any) {
       toast({
          variant: "destructive",
          title: "Google Sign-in Failed",
          description: error.message || "An unknown error occurred. Please try again.",
       });
       setIsGoogleLoading(false);
    }
  }
  
  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.1 512 0 401.9 0 265.9 0 129.9 110.1 20 244 20c69.1 0 128.8 28.2 173.4 72.9l-65.7 64.2C335.5 119.5 293.6 96 244 96c-82.6 0-149.7 67.4-149.7 150S161.4 396 244 396c94.9 0 132.3-72.8 136.2-109.3H244v-85.1h236.1c2.4 12.8 3.9 26.6 3.9 41z"></path>
    </svg>
  );

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
