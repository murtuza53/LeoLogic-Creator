import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const vectorServices = [
    {
        name: 'Vectorizer.AI',
        description: 'A fully automated AI-powered tool that quickly converts JPEGs and PNGs into high-quality SVG vectors. Known for its speed and accuracy.',
        url: 'https://vectorizer.ai/',
    },
    {
        name: 'Vector Magic',
        description: 'A popular and powerful online and desktop tool that provides precise tracing with a range of settings for professional results.',
        url: 'https://vectormagic.com/',
    },
    {
        name: 'Adobe Express',
        description: 'Adobe\'s free online tool offers a simple way to convert images to SVG format, integrated with the Adobe Creative Cloud ecosystem.',
        url: 'https://www.adobe.com/express/feature/image/convert/svg',
    },
]

export default function VectorizerPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <nav className="flex items-center gap-2 text-lg font-medium md:text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">LeoLogic Creator</span>
          </Link>
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
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Image to Vector Converters
            </h1>
            <p className="mt-3 text-lg text-muted-foreground md:text-xl">
              Converting raster images (like PNGs or JPEGs) into scalable vector graphics (like SVGs) requires specialized tracing tools. Here are our recommendations for the best online services.
            </p>
          </div>
          <div className="mt-12 grid gap-8">
            {vectorServices.map((service) => (
                <Card key={service.name} className="shadow-lg">
                    <CardHeader>
                        <CardTitle className='flex items-center justify-between'>
                            {service.name}
                             <Button asChild variant="outline">
                                <Link href={service.url} target="_blank" rel="noopener noreferrer">
                                    Visit Site <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
