import OcrProcessor from '@/components/ocr-processor';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function OcrPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <nav className="flex items-center gap-2 text-lg font-medium md:text-sm">
          <a
            href="#"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">LeoLogic Creator</span>
          </a>
          <span className="font-semibold">LeoLogic Creator</span>
        </nav>
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Optical Character Recognition (OCR)
            </h1>
            <p className="mt-3 text-lg text-muted-foreground md:text-xl">
              Upload or paste an image to extract text and reconstruct its original formatting with AI.
            </p>
          </div>
          <OcrProcessor />
        </div>
      </main>
    </div>
  );
}
