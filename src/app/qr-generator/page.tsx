
import type { Metadata } from 'next';
import QrGenerator from '@/components/qr-generator';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/footer';
import TopAdBanner from '@/components/top-ad-banner';
import BottomAdBanner from '@/components/bottom-ad-banner';

export const metadata: Metadata = {
  title: 'Free QR Code Generator',
  description: 'Create custom QR codes for any text or URL. Customize the colors, size, and style of your QR code and download it as a high-quality PNG file for free.',
  openGraph: {
    title: 'Free QR Code Generator | Leo Creator',
    description: 'Create and customize QR codes for any text or URL.',
  },
  twitter: {
    title: 'Free QR Code Generator | Leo Creator',
    description: 'Create and customize QR codes for any text or URL.',
  },
};

export default function QrGeneratorPage() {
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
      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              QR Code Generator
            </h1>
            <p className="mt-3 text-lg text-muted-foreground md:text-xl">
              Create and customize QR codes for any text or URL.
            </p>
          </div>
          <TopAdBanner />
          <QrGenerator />
        </div>
      </main>
      <BottomAdBanner />
      <Footer />
    </div>
  );
}
