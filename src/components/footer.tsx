
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/about" className="text-sm font-medium hover:text-foreground text-muted-foreground">About Us</Link>
          <Link href="/contact" className="text-sm font-medium hover:text-foreground text-muted-foreground">Contact Us</Link>
          <Link href="/privacy-policy" className="text-sm font-medium hover:text-foreground text-muted-foreground">Privacy Policy</Link>
          <Link href="/terms-of-use" className="text-sm font-medium hover:text-foreground text-muted-foreground">Terms of Use</Link>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Image src="/logo.png" alt="Souq e Kamil Trading & Solutions" width={40} height={40} />
          <div className='text-center'>
            <p className="text-sm font-bold">Souq e Kamil Trading & Solutions</p>
            <p className="text-xs text-muted-foreground">Innovation at the Core</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">&copy; 2025 Leo Creator. All rights reserved.</p>
      </div>
    </footer>
  );
}
