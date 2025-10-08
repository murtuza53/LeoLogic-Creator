

import AdBanner from '@/components/ad-banner';
import Footer from '@/components/footer';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
        <div className="mx-auto max-w-4xl prose dark:prose-invert">
            <h1>Privacy Policy for Leo Creator</h1>

            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

            <p>Welcome to Leo Creator! This Privacy Policy explains how we collect, use, and disclose information about you when you use our website and services.</p>

            <h2>1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
                <li><strong>Contact Information:</strong> When you use our contact form, we collect your name, email address, and any message you send us.</li>
                <li><strong>Usage Data:</strong> We may collect anonymous data about your interactions with our tools, such as which features are used most frequently. This is to help us improve our services.</li>
                <li><strong>Content You Provide:</strong> When you use our AI tools (e.g., product generator, math solver), we process the data you input (like product names, images, or math problems) to provide the service. This data is not stored long-term.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
                <li>Provide, maintain, and improve our services.</li>
                <li>Respond to your comments, questions, and requests.</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
                <li>Prevent fraudulent activity and ensure the security of our platform.</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We do not share your personal information with third parties, except in the following cases:</p>
            <ul>
                <li>With your consent.</li>
                <li>To comply with a legal obligation.</li>
                <li>To protect and defend our rights or property.</li>
            </ul>
             <p>Anonymous, aggregated usage data may be shared with our partners for analytics purposes.</p>

            <h2>4. Data Storage</h2>
            <p>Your contact form submissions are stored securely in our Firestore database. The content you provide to our AI tools is processed by our AI provider (Google) but is not stored by us after the processing is complete.</p>

            <h2>5. Your Rights</h2>
            <p>You have the right to request access to or deletion of your personal data. Please use our contact form to make such a request.</p>

            <h2>6. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us through our <Link href="/contact">contact page</Link>.</p>
        </div>
      </main>
      <AdBanner />
      <Footer />
    </div>
  );
}
