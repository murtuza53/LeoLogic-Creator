import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import 'katex/dist/katex.min.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { FirebaseClientProvider } from '@/firebase';
import GoogleAds from '@/components/google-ads';

export const metadata: Metadata = {
  title: 'Leo Creator',
  description: 'Generate product descriptions and specifications with AI.',
  manifest: '/manifest.json',
  icons: {
    icon: {
      url: `/favicon.png`,
      type: 'image/png',
    }
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
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <SpeedInsights />
          <Toaster />
          <GoogleAds />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
