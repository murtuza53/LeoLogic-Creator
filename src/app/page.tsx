"use client";

import { useEffect, useState } from 'react';
import { ArrowRight, Calculator, Library, QrCode, ScanText, FileJson, Image as ImageIcon, FileSpreadsheet, Eraser, Palette, Crop } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GenerationCounter from '@/components/generation-counter';
import { getFeatureCounts } from './actions';
import { Feature } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [counts, setCounts] = useState<Record<Feature, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const featureCounts = await getFeatureCounts();
        setCounts(featureCounts);
      } catch (error) {
        console.error("Failed to fetch feature counts:", error);
        // Set to default zeros on error
        const initialCounts: Record<Feature, number> = {
            smartProduct: 0,
            aiMath: 0,
            benefitPay: 0,
            ocr: 0,
            mergePdf: 0,
            imageExcel: 0,
            imageToWebp: 0,
            imgRemoveBg: 0,
            imgChangeBg: 0,
            resizeCropImage: 0,
        };
        setCounts(initialCounts);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
          <span className="font-semibold">Leo Creator</span>
        </div>
        <Button asChild>
          <a href="/creator">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </a>
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
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Why You&apos;ll Love Leo Creator</h2>
                        <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Our suite of AI-powered tools is designed to streamline your content creation process, saving you time and boosting your productivity.
                        </p>
                    </div>
                </div>
                <div className="mx-auto max-w-5xl pt-12 space-y-8">
                  <Card className="shadow-lg">
                      <CardHeader>
                          <CardTitle className="text-2xl font-bold text-center">Smart Tools</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-2">
                              <Link href="/creator" className="h-full block">
                                  <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                      <div className='flex flex-col h-full p-6 pb-12'>
                                        <CardHeader className='p-0'>
                                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                              <Library className="h-5 w-5 text-primary" />
                                              Smart Product Content
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className='p-0 mt-2 flex-1'>
                                          <p className="text-sm text-muted-foreground">
                                              Generate unique, SEO-friendly product descriptions, detailed specifications, and studio-quality images from a single upload.
                                          </p>
                                        </CardContent>
                                      </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-purple-100 dark:bg-purple-900/50 text-center">
                                      <GenerationCounter count={counts?.smartProduct} isLoading={loading} label="Products Generated" />
                                    </div>
                                  </Card>
                              </Link>
                              <Link href="/math-solver" className="h-full block">
                                  <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                      <div className='flex flex-col h-full p-6 pb-12'>
                                          <CardHeader className='p-0'>
                                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                              <Calculator className="h-5 w-5 text-primary" />
                                              AI Math Solver
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className='p-0 mt-2 flex-1'>
                                          <p className="text-sm text-muted-foreground">
                                            Get step-by-step solutions to complex math problems, from algebra to calculus, with clear, AI-driven explanations.
                                          </p>
                                        </CardContent>
                                      </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-green-100 dark:bg-green-900/50 text-center">
                                        <GenerationCounter count={counts?.aiMath} isLoading={loading} label="Problems Solved" />
                                    </div>
                                  </Card>
                              </Link>
                              <Link href="/benefit-pay-qr" className="h-full block">
                                  <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                      <div className='flex flex-col h-full p-6 pb-12'>
                                        <CardHeader className='p-0'>
                                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                              <QrCode className="h-5 w-5 text-primary" />
                                              Benefit Pay QR Generator
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className='p-0 mt-2 flex-1'>
                                          <p className="text-sm text-muted-foreground">
                                            Create and customize QR codes for Benefit Pay transactions quickly and easily.
                                          </p>
                                        </CardContent>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-pink-100 dark:bg-pink-900/50 text-center">
                                        <GenerationCounter count={counts?.benefitPay} isLoading={loading} label="QRs Generated" />
                                      </div>
                                  </Card>
                              </Link>
                              <Link href="/ocr" className="h-full block">
                                  <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                    <div className='flex flex-col h-full p-6 pb-12'>
                                        <CardHeader className='p-0'>
                                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                              <ScanText className="h-5 w-5 text-primary" />
                                              Optical Character Recognition
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className='p-0 mt-2 flex-1'>
                                          <p className="text-sm text-muted-foreground">
                                            Extract text and reconstruct its original formatting from any image with high accuracy.
                                          </p>
                                        </CardContent>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-orange-100 dark:bg-orange-900/50 text-center">
                                      <GenerationCounter count={counts?.ocr} isLoading={loading} label="Images Recognized" />
                                    </div>
                                  </Card>
                              </Link>
                          </div>
                      </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                      <CardHeader>
                          <CardTitle className="text-2xl font-bold text-center">Image Tools</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-2">
                            <Link href="/image-to-webp" className="h-full block">
                                <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                  <div className='flex flex-col h-full p-6 pb-12'>
                                      <CardHeader className='p-0'>
                                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                            <ImageIcon className="h-5 w-5 text-primary" />
                                            Image to WebP
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className='p-0 mt-2 flex-1'>
                                        <p className="text-sm text-muted-foreground">
                                          Convert images to the efficient WebP format with just one click.
                                        </p>
                                      </CardContent>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-yellow-100 dark:bg-yellow-900/50 text-center">
                                    <GenerationCounter count={counts?.imageToWebp} isLoading={loading} label="Images Converted" />
                                  </div>
                                </Card>
                            </Link>
                            <Link href="/remove-background" className="h-full block">
                              <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                <div className='flex flex-col h-full p-6 pb-12'>
                                    <CardHeader className='p-0'>
                                      <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                          <Eraser className="h-5 w-5 text-primary" />
                                          Remove Background
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className='p-0 mt-2 flex-1'>
                                      <p className="text-sm text-muted-foreground">
                                        Upload an image to automatically remove its background.
                                      </p>
                                    </CardContent>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-rose-100 dark:bg-rose-900/50 text-center">
                                  <GenerationCounter count={counts?.imgRemoveBg} isLoading={loading} label="Backgrounds Removed" />
                                </div>
                              </Card>
                            </Link>
                            <Link href="/change-background" className="h-full block">
                              <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                <div className='flex flex-col h-full p-6 pb-12'>
                                    <CardHeader className='p-0'>
                                      <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                          <Palette className="h-5 w-5 text-primary" />
                                          Change Background
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className='p-0 mt-2 flex-1'>
                                      <p className="text-sm text-muted-foreground">
                                        Replace an image's background with a color of your choice.
                                      </p>
                                    </CardContent>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-indigo-100 dark:bg-indigo-900/50 text-center">
                                  <GenerationCounter count={counts?.imgChangeBg} isLoading={loading} label="Backgrounds Changed" />
                                </div>
                              </Card>
                            </Link>
                             <Link href="/resize-crop-image" className="h-full block">
                              <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                <div className='flex flex-col h-full p-6 pb-12'>
                                    <CardHeader className='p-0'>
                                      <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                          <Crop className="h-5 w-5 text-primary" />
                                          Resize & Crop Image
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className='p-0 mt-2 flex-1'>
                                      <p className="text-sm text-muted-foreground">
                                        Remove background, resize, and crop images to a square size.
                                      </p>
                                    </CardContent>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-cyan-100 dark:bg-cyan-900/50 text-center">
                                  <GenerationCounter count={counts?.resizeCropImage} isLoading={loading} label="Images Processed" />
                                </div>
                              </Card>
                            </Link>
                          </div>
                      </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                      <CardHeader>
                          <CardTitle className="text-2xl font-bold text-center">Document Tools</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-2">
                            <Link href="/pdf-merger" className="h-full block">
                                <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                  <div className='flex flex-col h-full p-6 pb-12'>
                                      <CardHeader className='p-0'>
                                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                            <FileJson className="h-5 w-5 text-primary" />
                                            Merge Multiple PDFs
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className='p-0 mt-2 flex-1'>
                                        <p className="text-sm text-muted-foreground">
                                          Combine multiple PDF documents into a single, organized file effortlessly.
                                        </p>
                                      </CardContent>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-100 dark:bg-red-900/50 text-center">
                                    <GenerationCounter count={counts?.mergePdf} isLoading={loading} label="PDFs Merged" />
                                  </div>
                                </Card>
                            </Link>
                            <Link href="/table-extractor" className="h-full block">
                              <Card className="relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
                                <div className='flex flex-col h-full p-6 pb-12'>
                                    <CardHeader className='p-0'>
                                      <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                          <FileSpreadsheet className="h-5 w-5 text-primary" />
                                          Image to Excel
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className='p-0 mt-2 flex-1'>
                                      <p className="text-sm text-muted-foreground">
                                        Extract tabular data from an image and export it to a styled Excel file.
                                      </p>
                                    </CardContent>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-teal-100 dark:bg-teal-900/50 text-center">
                                  <GenerationCounter count={counts?.imageExcel} isLoading={loading} label="Tables Extracted" />
                                </div>
                              </Card>
                            </Link>
                          </div>
                      </CardContent>
                  </Card>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex items-center justify-center p-6 border-t">
         <p className="text-xs text-muted-foreground">&copy; 2025 Leo Creator. All rights reserved.</p>
      </footer>
    </div>
  );
}
