
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import 'katex/dist/katex.min.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { FirebaseClientProvider } from '@/firebase';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leocreator.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Leo Creator | Free AI & Productivity Tools',
    template: '%s | Leo Creator',
  },
  description: 'Boost your productivity with a suite of free, AI-powered online tools. Convert files, edit images, generate content, and solve complex problems instantly.',
  manifest: '/manifest.json',
  icons: {
    icon: {
      url: `/favicon.png`,
      type: 'image/png',
    }
  },
  openGraph: {
    title: 'Leo Creator | Free AI & Productivity Tools',
    description: 'Boost your productivity with a suite of free, AI-powered online tools. Convert files, edit images, generate content, and solve complex problems instantly.',
    url: siteUrl,
    siteName: 'Leo Creator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Leo Creator - Free Online Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leo Creator | Free AI & Productivity Tools',
    description: 'Boost your productivity with a suite of free, AI-powered online tools. Convert files, edit images, generate content, and solve complex problems instantly.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'YOUR_GOOGLE_SITE_VERIFICATION_CODE', // Replace with your verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3831799948487423"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {/* Left Floating Ad */}
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
          </div>

          {children}

          {/* Right Floating Ad */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
          </div>

          <SpeedInsights />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
