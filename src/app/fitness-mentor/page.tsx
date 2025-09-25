
import FitnessMentor from '@/components/fitness-mentor';
import Footer from '@/components/footer';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function FitnessMentorPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <nav className="flex items-center gap-2 text-lg font-medium md:text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">Leo Creator</span>
          </Link>
          <span className="font-semibold">Leo Creator</span>
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
      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              AI Fitness Mentor
            </h1>
            <p className="mt-3 text-lg text-muted-foreground md:text-xl">
              Your personal guide for health and fitness questions.
            </p>
          </div>
          <FitnessMentor />
        </div>
      </main>
      <Footer />
    </div>
  );
}
