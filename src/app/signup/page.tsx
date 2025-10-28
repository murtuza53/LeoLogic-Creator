
import type { Metadata } from 'next';
import SignupForm from '@/components/signup-form';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/footer';
import TopAdBanner from '@/components/top-ad-banner';
import BottomAdBanner from '@/components/bottom-ad-banner';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a free account on Leo Creator to unlock unlimited tool usage, advanced features, and priority support.',
  openGraph: {
    title: 'Sign Up | Leo Creator',
    description: 'Join Leo Creator to get started.',
  },
  twitter: {
    title: 'Sign Up | Leo Creator',
    description: 'Join Leo Creator to get started.',
  },
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <nav className="flex items-center gap-2 text-lg font-medium md:text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-semibold">Leo Creator</span>
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 lg:p-10 flex items-center justify-center">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Create an Account
            </h1>
            <p className="mt-3 text-lg text-muted-foreground md:text-xl">
              Join Leo Creator to get started.
            </p>
          </div>
          <TopAdBanner />
          <SignupForm />
        </div>
      </main>
      <BottomAdBanner />
      <Footer />
    </div>
  );
}
