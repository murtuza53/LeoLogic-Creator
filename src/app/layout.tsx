
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
            <Script id="adsterra-left-banner" strategy="afterInteractive">
              {`
                var atAsyncOptions = atAsyncOptions || [];
                atAsyncOptions.push({
                  'key': '07c48e6862603f79a58b3921b35b86dc',
                  'format': 'js',
                  'async': true,
                  'container': 'atContainer-07c48e6862603f79a58b3921b35b86dc',
                  'params' : {}
                });
                var script = document.createElement('script');
                script.type = "text/javascript";
                script.async = true;
                script.src = 'https' + (location.protocol === 'https:' ? 's' : '') + '://www.topcreativeformat.com/07c48e6862603f79a58b3921b35b86dc/invoke.js';
                document.getElementById('atContainer-07c48e6862603f79a58b3921b35b86dc').appendChild(script);
              `}
            </Script>
            <div id="atContainer-07c48e6862603f79a58b3921b35b86dc"></div>
          </div>

          {children}

          {/* Right Floating Ad */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
            <Script
              id="adsterra-right-banner"
              strategy="afterInteractive"
            >{`
              var atOptions = {
                'key' : '23b55c65512b912c53099505c3099a50',
                'format' : 'iframe',
                'height' : 300,
                'width' : 160,
                'params' : {}
              };
            `}</Script>
            <Script
              src="//www.topcreativeformat.com/23b55c65512b912c53099505c3099a50/invoke.js"
              strategy="afterInteractive"
            />
          </div>

          <SpeedInsights />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
