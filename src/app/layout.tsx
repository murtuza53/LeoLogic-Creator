import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import 'katex/dist/katex.min.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { FirebaseClientProvider } from '@/firebase';
import Script from 'next/script';

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
            <Script async data-cfasync="false" src="//pl27805151.revenuecpmgate.com/94ae52161e71e5c557f12c90150ad810/invoke.js" />
            <div id="container-94ae52161e71e5c557f12c90150ad810"></div>
          </div>
          
          {children}

          {/* Right Floating Ad */}
           <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
            <Script async data-cfasync="false" src="//pl27805151.revenuecpmgate.com/94ae52161e71e5c557f12c90150ad810/invoke.js" />
            <div id="container-94ae52161e71e5c557f12c90150ad810-2"></div>
          </div>

          <SpeedInsights />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
