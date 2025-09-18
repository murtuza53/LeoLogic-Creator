import { ArrowRight, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
          <span className="font-semibold">LeoLogic Creator</span>
        </div>
        <Button asChild>
          <Link href="/creator">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-1 lg:gap-12 xl:grid-cols-1">
              <div className="flex flex-col justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                    Generate Digital Content in Seconds
                  </h1>
                  <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
                    Leverage AI to create compelling product descriptions, solve complex math problems, and more.
                  </p>
                </div>
                <div className="flex w-full flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <Button asChild className="w-full sm:w-auto" size="lg">
                    <Link href="/creator">
                      Start Creating Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-muted/40 py-12 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <Badge variant="outline">Key Features</Badge>
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Why You&apos;ll Love LeoLogic Creator</h2>
                        <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Our suite of AI-powered tools is designed to streamline your content creation process, saving you time and boosting your productivity.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-2">
                    <Link href="/creator" className='h-full'>
                      <Card className="grid gap-1 rounded-lg border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md h-full">
                          <CardHeader className='p-0'>
                            <CardTitle className="text-lg font-bold">Smart Product Content Generation</CardTitle>
                          </CardHeader>
                          <CardContent className='p-0 mt-2'>
                            <p className="text-sm text-muted-foreground">
                                Generate unique, SEO-friendly product descriptions, detailed specifications, and studio-quality images from a single upload.
                            </p>
                          </CardContent>
                      </Card>
                    </Link>
                    <Link href="/math-solver" className='h-full'>
                      <Card className="grid gap-1 rounded-lg border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md h-full">
                          <CardHeader className='p-0'>
                            <CardTitle className="text-lg font-bold">AI Math Problem Solver</CardTitle>
                          </CardHeader>
                          <CardContent className='p-0 mt-2'>
                            <p className="text-sm text-muted-foreground">
                              Get step-by-step solutions to complex math problems, from algebra to calculus, with clear, AI-driven explanations.
                            </p>
                          </CardContent>
                      </Card>
                    </Link>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex items-center justify-center p-6 border-t">
         <p className="text-xs text-muted-foreground">&copy; 2024 LeoLogic Creator. All rights reserved.</p>
      </footer>
    </div>
  );
}
