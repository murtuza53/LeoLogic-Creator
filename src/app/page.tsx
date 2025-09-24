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
        <section className="w-full py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-1 lg:gap-12 xl:grid-cols-1">
              <div className="flex flex-col justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                    Free Tools to Make <span className='bg-accent text-accent-foreground px-4 rounded-md'>Your Life</span> Simple
                  </h1>
                   <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        We offer PDF, video, image and other online tools to make your life easier
                    </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-muted/40 py-12 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  <Link href="/creator" className="h-full block group">
                      <Card className="relative flex flex-col gap-1 rounded-lg border bg-purple-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                          <div className='flex flex-col h-full p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <Library className="h-8 w-8" />
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-4 flex-1'>
                              <p className="font-bold text-lg">Smart Product Content</p>
                              <p className="text-sm text-purple-200 mt-1">
                                  Generate unique, SEO-friendly product descriptions and specs.
                              </p>
                            </CardContent>
                          </div>
                        <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                      </Card>
                  </Link>
                  <Link href="/math-solver" className="h-full block group">
                      <Card className="relative flex flex-col gap-1 rounded-lg border bg-green-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                          <div className='flex flex-col h-full p-6 pb-12'>
                              <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <Calculator className="h-8 w-8" />
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-4 flex-1'>
                              <p className="font-bold text-lg">AI Math Solver</p>
                              <p className="text-sm text-green-200 mt-1">
                                Get step-by-step solutions to complex math problems.
                              </p>
                            </CardContent>
                          </div>
                        <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                      </Card>
                  </Link>
                  <Link href="/benefit-pay-qr" className="h-full block group">
                      <Card className="relative flex flex-col gap-1 rounded-lg border bg-pink-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                          <div className='flex flex-col h-full p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <QrCode className="h-8 w-8" />
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-4 flex-1'>
                              <p className="font-bold text-lg">Benefit Pay QR</p>
                              <p className="text-sm text-pink-200 mt-1">
                                Create and customize QR codes for Benefit Pay transactions.
                              </p>
                            </CardContent>
                          </div>
                          <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                      </Card>
                  </Link>
                  <Link href="/ocr" className="h-full block group">
                      <Card className="relative flex flex-col gap-1 rounded-lg border bg-orange-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                        <div className='flex flex-col h-full p-6 pb-12'>
                            <CardHeader className='p-0'>
                              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                  <ScanText className="h-8 w-8" />
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='p-0 mt-4 flex-1'>
                              <p className="font-bold text-lg">OCR</p>
                              <p className="text-sm text-orange-200 mt-1">
                                Extract text and its original formatting from any image.
                              </p>
                            </CardContent>
                        </div>
                        <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                      </Card>
                  </Link>
                  <Link href="/image-to-webp" className="h-full block group">
                    <Card className="relative flex flex-col gap-1 rounded-lg border bg-yellow-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                      <div className='flex flex-col h-full p-6 pb-12'>
                          <CardHeader className='p-0'>
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <ImageIcon className="h-8 w-8" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className='p-0 mt-4 flex-1'>
                            <p className="font-bold text-lg">Image to WebP</p>
                            <p className="text-sm text-yellow-200 mt-1">
                              Convert images to the efficient WebP format.
                            </p>
                          </CardContent>
                      </div>
                      <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                    </Card>
                  </Link>
                  <Link href="/remove-background" className="h-full block group">
                  <Card className="relative flex flex-col gap-1 rounded-lg border bg-rose-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                    <div className='flex flex-col h-full p-6 pb-12'>
                        <CardHeader className='p-0'>
                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                              <Eraser className="h-8 w-8" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-0 mt-4 flex-1'>
                          <p className="font-bold text-lg">Remove Background</p>
                          <p className="text-sm text-rose-200 mt-1">
                            Automatically remove an image's background.
                          </p>
                        </CardContent>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                  </Card>
                </Link>
                <Link href="/change-background" className="h-full block group">
                  <Card className="relative flex flex-col gap-1 rounded-lg border bg-indigo-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                    <div className='flex flex-col h-full p-6 pb-12'>
                        <CardHeader className='p-0'>
                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                              <Palette className="h-8 w-8" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-0 mt-4 flex-1'>
                          <p className="font-bold text-lg">Change Background</p>
                          <p className="text-sm text-indigo-200 mt-1">
                            Replace an image's background with a solid color.
                          </p>
                        </CardContent>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                  </Card>
                </Link>
                 <Link href="/resize-crop-image" className="h-full block group">
                  <Card className="relative flex flex-col gap-1 rounded-lg border bg-cyan-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                    <div className='flex flex-col h-full p-6 pb-12'>
                        <CardHeader className='p-0'>
                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                              <Crop className="h-8 w-8" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-0 mt-4 flex-1'>
                          <p className="font-bold text-lg">Resize & Crop</p>
                          <p className="text-sm text-cyan-200 mt-1">
                            Resize and crop images to a perfect square.
                          </p>
                        </CardContent>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                  </Card>
                </Link>
                <Link href="/pdf-merger" className="h-full block group">
                    <Card className="relative flex flex-col gap-1 rounded-lg border bg-red-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                      <div className='flex flex-col h-full p-6 pb-12'>
                          <CardHeader className='p-0'>
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <FileJson className="h-8 w-8" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className='p-0 mt-4 flex-1'>
                            <p className="font-bold text-lg">Merge PDFs</p>
                            <p className="text-sm text-red-200 mt-1">
                              Combine multiple PDF documents into a single file.
                            </p>
                          </CardContent>
                      </div>
                      <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                    </Card>
                </Link>
                <Link href="/table-extractor" className="h-full block group">
                  <Card className="relative flex flex-col gap-1 rounded-lg border bg-teal-500 text-white shadow-lg transition-all hover:scale-105 h-full overflow-hidden">
                    <div className='flex flex-col h-full p-6 pb-12'>
                        <CardHeader className='p-0'>
                          <CardTitle className="flex items-center gap-2 text-lg font-bold">
                              <FileSpreadsheet className="h-8 w-8" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-0 mt-4 flex-1'>
                          <p className="font-bold text-lg">Image to Excel</p>
                          <p className="text-sm text-teal-200 mt-1">
                            Extract tabular data from images and export to Excel.
                          </p>
                        </CardContent>
                    </div>
                    <div className="absolute bottom-4 right-4 p-2 text-sm">
                          <ArrowRight className='transition-transform group-hover:translate-x-1'/>
                        </div>
                  </Card>
                </Link>
                </div>
                
                <div className="mt-16 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Usage Statistics</h2>
                        <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           See how many creations have been made by the community.
                        </p>
                    </div>
                </div>
                <div className="mx-auto max-w-5xl pt-12 grid grid-cols-2 md:grid-cols-5 gap-8">
                  <div className='text-center'>
                    <p className='text-4xl font-bold text-primary'>{loading ? <Skeleton className='h-10 w-24 mx-auto' /> : (counts?.smartProduct ?? 0)}</p>
                    <p className='text-muted-foreground'>Products</p>
                  </div>
                   <div className='text-center'>
                    <p className='text-4xl font-bold text-primary'>{loading ? <Skeleton className='h-10 w-24 mx-auto' /> : (counts?.aiMath ?? 0)}</p>
                    <p className='text-muted-foreground'>Math Problems</p>
                  </div>
                   <div className='text-center'>
                    <p className='text-4xl font-bold text-primary'>{loading ? <Skeleton className='h-10 w-24 mx-auto' /> : (counts?.benefitPay ?? 0)}</p>
                    <p className='text-muted-foreground'>QRs</p>
                  </div>
                   <div className='text-center'>
                    <p className='text-4xl font-bold text-primary'>{loading ? <Skeleton className='h-10 w-24 mx-auto' /> : (counts?.ocr ?? 0)}</p>
                    <p className='text-muted-foreground'>OCRs</p>
                  </div>
                   <div className='text-center'>
                    <p className='text-4xl font-bold text-primary'>{loading ? <Skeleton className='h-10 w-24 mx-auto' /> : (counts?.imageExcel ?? 0)}</p>
                    <p className='text-muted-foreground'>Tables</p>
                  </div>
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
