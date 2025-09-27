
import Footer from '@/components/footer';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
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
            <h1>About Us</h1>
            
            <p>
              Leo Creator is a project by <strong>Souq e Kamil Trading & Solutions WLL</strong>, an innovative IT company dedicated to delivering cutting-edge technology and creative solutions. We believe in empowering businesses and individuals by making advanced tools accessible and easy to use.
            </p>

            <h2>Our Core Services</h2>
            <p>
              At Souq e Kamil, we offer a comprehensive suite of IT services designed to meet the diverse needs of modern businesses. Our expertise includes:
            </p>
            <ul>
                <li><strong>ERP Systems:</strong> Implementing robust Enterprise Resource Planning solutions to streamline business processes and improve efficiency.</li>
                <li><strong>Website Development:</strong> Crafting beautiful, responsive, and high-performance websites that drive engagement and growth.</li>
                <li><strong>Mobile App Development:</strong> Building intuitive and powerful mobile applications for both iOS and Android platforms.</li>
                <li><strong>Networking Solutions:</strong> Designing and deploying secure and scalable network infrastructures to keep your business connected.</li>
            </ul>

            <h2>Pioneering Technology in Bahrain</h2>
            <p>
              We are proud to be the first company in Bahrain to introduce the <strong>MinisForum</strong> brand of Mini PCs. These powerful, compact computers are changing the game for both personal and professional use. You can explore the full range of MinisForum products on our official retail website, <a href="https://www.souqekamil.com" target="_blank" rel="noopener noreferrer">www.souqekamil.com</a>.
            </p>

            <h2>Innovation in Action</h2>
            <p>
              This very application, Leo Creator, is a testament to our commitment to innovation. We wanted to build a platform that showcases the power of generative AI in a practical way, offering a suite of free tools that can boost productivity and creativity for everyone. It's an example of how we take emerging technologies and turn them into tangible, useful solutions for the market.
            </p>
            <p>
              Thank you for using Leo Creator. We are constantly working on new ideas and solutions, and we're excited to have you with us on this journey.
            </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
