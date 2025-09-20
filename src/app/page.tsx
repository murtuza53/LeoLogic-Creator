import { ArrowRight, Calculator, Library, QrCode, ScanText, FileJson, FileImage } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GenerationCounter from '@/components/generation-counter';
import { getFeatureCounts } from './actions';

export default async function Home() {
  const counts = await getFeatureCounts();

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
        <section className="w-full py-6">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-1 lg:gap-12 xl:grid-cols-1">
              <div className="flex flex-col justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                    Generate Digital Content in Seconds
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-muted/40 py-12 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Why You&apos;ll Love LeoLogic Creator</h2>
                        <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Our suite of AI-powered tools is designed to streamline your content creation process, saving you time and boosting your productivity.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
                    <Card className="relative grid gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                      <Link href="/creator" className='h-full'>
                          <div className='p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <Library className="h-5 w-5 text-primary" />
                                  Smart Product Content Generation
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-2'>
                              <p className="text-sm text-muted-foreground">
                                  Generate unique, SEO-friendly product descriptions, detailed specifications, and studio-quality images from a single upload.
                              </p>
                            </CardContent>
                          </div>
                      </Link>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-blue-100 dark:bg-blue-900/50 text-center">
                        <GenerationCounter count={counts.product} label="Generated" />
                      </div>
                    </Card>
                    <Card className="relative grid gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                       <Link href="/math-solver" className='h-full'>
                           <div className='p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <Calculator className="h-5 w-5 text-primary" />
                                  AI Math Problem Solver
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-2'>
                              <p className="text-sm text-muted-foreground">
                                Get step-by-step solutions to complex math problems, from algebra to calculus, with clear, AI-driven explanations.
                              </p>
                            </CardContent>
                          </div>
                       </Link>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-green-100 dark:bg-green-900/50 text-center">
                          <GenerationCounter count={counts.math} label="Solved" />
                      </div>
                    </Card>
                    <Card className="relative grid gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                       <Link href="/benefit-pay-qr" className='h-full'>
                          <div className='p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <QrCode className="h-5 w-5 text-primary" />
                                  Benefit Pay QR Generator
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-2'>
                              <p className="text-sm text-muted-foreground">
                                Create and customize QR codes for Benefit Pay transactions quickly and easily.
                              </p>
                            </CardContent>
                          </div>
                       </Link>
                       <div className="absolute bottom-0 left-0 right-0 p-2 bg-purple-100 dark:bg-purple-900/50 text-center">
                          <GenerationCounter count={counts.qr} label="Generated" />
                       </div>
                    </Card>
                    <Card className="relative grid gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                      <Link href="/ocr" className='h-full'>
                          <div className='p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <ScanText className="h-5 w-5 text-primary" />
                                  Optical Character Recognition (OCR)
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-2'>
                              <p className="text-sm text-muted-foreground">
                                Extract text and reconstruct its original formatting from any image with high accuracy.
                              </p>
                            </CardContent>
                          </div>
                      </Link>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-orange-100 dark:bg-orange-900/50 text-center">
                        <GenerationCounter count={counts.ocr} label="Recognised" />
                      </div>
                    </Card>
                    <Card className="relative grid gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                      <Link href="/pdf-merger" className='h-full'>
                          <div className='p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <FileJson className="h-5 w-5 text-primary" />
                                  Merge Multiple PDFs
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-2'>
                              <p className="text-sm text-muted-foreground">
                                Combine multiple PDF documents into a single, organized file effortlessly.
                              </p>
                            </CardContent>
                          </div>
                      </Link>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-100 dark:bg-red-900/50 text-center">
                        <GenerationCounter count={counts.pdf} label="Merged" />
                      </div>
                    </Card>
                    <Card className="relative grid gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                      <Link href="/extract-pdf-images" className='h-full'>
                          <div className='p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <FileImage className="h-5 w-5 text-primary" />
                                  Extract Images from PDF
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-2'>
                              <p className="text-sm text-muted-foreground">
                                Upload a PDF to automatically extract all embedded images for download.
                              </p>
                            </CardContent>
                          </div>
                      </Link>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-teal-100 dark:bg-teal-900/50 text-center">
                        <GenerationCounter count={counts.pdfImages} label="Extracted" />
                      </div>
                    </Card>
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
