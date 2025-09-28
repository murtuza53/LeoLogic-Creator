import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import 'katex/dist/katex.min.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Leo Creator',
  description: 'Generate product descriptions and specifications with AI.',
  manifest: '/manifest.json',
  icons: {
    icon: {
      url: `/favicon.png?v=2`,
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
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4404974079606262" crossOrigin="anonymous"></script>
        <script async custom-element="amp-auto-ads" src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js">
</script>
      </head>
      <body className="font-body antialiased">
      <amp-auto-ads type="adsense" data-ad-client="ca-pub-4404974079606262"></amp-auto-ads>
        <FirebaseClientProvider>
          {children}
          <SpeedInsights />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
