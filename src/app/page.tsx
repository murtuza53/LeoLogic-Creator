
"use client";

import { useEffect, useState, useMemo } from 'react';
import { ArrowRight, Calculator, Library, QrCode, ScanText, FileJson, Image as ImageIcon, FileSpreadsheet, Eraser, Palette, Crop, Search, Brush, FileArchive, HeartPulse, MessageCircle, SplitSquareHorizontal, Flame, Scale, Contact } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { getFeatureCounts } from './actions';
import { Feature } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Footer from '@/components/footer';

const tools = [
    { 
        title: 'Smart Product Content', 
        description: 'Generate unique, SEO-friendly product descriptions and specs.', 
        href: '/creator', 
        icon: Library, 
        category: 'AI / ML',
        feature: 'smartProduct' as Feature,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600'
    },
    { 
        title: 'AI Math Solver', 
        description: 'Get step-by-step solutions to complex math problems.', 
        href: '/math-solver', 
        icon: Calculator, 
        category: 'AI / ML',
        feature: 'aiMath' as Feature,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
    },
    { 
        title: 'QR Code Generator', 
        description: 'Create and customize QR codes for any text or URL.', 
        href: '/qr-generator', 
        icon: QrCode, 
        category: 'Productivity',
        feature: 'qrGenerator' as Feature,
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600'
    },
    { 
        title: 'Benefit Pay QR', 
        description: 'Generate QR codes for Benefit Pay transactions.', 
        href: '/benefit-pay-qr', 
        icon: QrCode, 
        category: 'Productivity',
        feature: 'benefitPay' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
    },
     { 
        title: 'Scientific Calculator', 
        description: 'Perform advanced mathematical calculations with ease.', 
        href: '/scientific-calculator', 
        icon: Calculator, 
        category: 'Productivity',
        feature: 'scientificCalculator' as Feature,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600'
    },
    { 
        title: 'Unit Converter', 
        description: 'Convert between various units of measurement.', 
        href: '/unit-converter', 
        icon: Scale, 
        category: 'Productivity',
        feature: 'unitConverter' as Feature,
        bgColor: 'bg-zinc-100',
        textColor: 'text-zinc-600'
    },
    { 
        title: 'OCR', 
        description: 'Extract text and its original formatting from any image.', 
        href: '/ocr', 
        icon: ScanText, 
        category: 'AI / ML',
        feature: 'ocr' as Feature,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600'
    },
    { _project_path: '/app/image-to-webp/page.tsx',
        title: 'Image to WebP', 
        description: 'Convert images to the efficient WebP format.', 
        href: '/image-to-webp', 
        icon: ImageIcon, 
        category: 'Image',
        feature: 'imageToWebp' as Feature,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
    },
    { 
        title: 'Remove Background', 
        description: 'Automatically remove an image\'s background.', 
        href: '/remove-background', 
        icon: Eraser, 
        category: 'Image',
        feature: 'imgRemoveBg' as Feature,
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-600'
    },
    {
        title: 'Change Background', 
        description: 'Replace an image\'s background with a solid color.', 
        href: '/change-background', 
        icon: Palette, 
        category: 'Image',
        feature: 'imgChangeBg' as Feature,
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600'
    },
    { 
        title: 'Resize & Crop', 
        description: 'Resize and crop images to a perfect square.', 
        href: '/resize-crop-image', 
        icon: Crop, 
        category: 'Image',
        feature: 'resizeCropImage' as Feature,
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-600'
    },
    { 
        title: 'Merge PDFs', 
        description: 'Combine multiple PDF documents into a single file.', 
        href: '/pdf-merger', 
        icon: FileJson, 
        category: 'PDF',
        feature: 'mergePdf' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
    },
    { 
        title: 'PDF Compress', 
        description: 'Reduce the file size of your PDF files.', 
        href: '/pdf-compress', 
        icon: FileArchive, 
        category: 'PDF',
        feature: 'pdfCompress' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
    },
    { 
        title: 'Split PDF', 
        description: 'Split a PDF into individual pages.', 
        href: '/split-pdf', 
        icon: SplitSquareHorizontal, 
        category: 'PDF',
        feature: 'splitPdf' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
    },
    { 
        title: 'Image to Excel', 
        description: 'Extract tabular data from images and export to Excel.', 
        href: '/table-extractor', 
        icon: FileSpreadsheet, 
        category: 'PDF',
        feature: 'imageExcel' as Feature,
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600'
    },
    { 
        title: 'Logo Maker', 
        description: 'Generate unique logo concepts with AI.', 
        href: '/logo-maker', 
        icon: Brush, 
        category: 'AI / ML',
        feature: 'logoMaker' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
    },
    { 
        title: 'BMI Calculator', 
        description: 'Calculate your Body Mass Index with a visual gauge.', 
        href: '/bmi-calculator', 
        icon: HeartPulse, 
        category: 'Health & Fitness',
        feature: 'bmiCalculator' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
    },
    { 
        title: 'BMR Calculator', 
        description: 'Calculate your Basal Metabolic Rate and daily calorie needs.', 
        href: '/bmr-calculator', 
        icon: Calculator, 
        category: 'Health & Fitness',
        feature: 'bmrCalculator' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
    },
     { 
        title: 'Weight Loss Calculator', 
        description: 'Estimate daily calorie targets for weight loss.', 
        href: '/weight-loss-calculator', 
        icon: Flame, 
        category: 'Health & Fitness',
        feature: 'weightLoss' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
    },
    { 
        title: 'Fitness Mentor', 
        description: 'Ask health and fitness questions to your AI mentor.', 
        href: '/fitness-mentor', 
        icon: MessageCircle, 
        category: 'Health & Fitness',
        feature: 'fitnessMentor' as Feature,
        bgColor: 'bg-lime-100',
        textColor: 'text-lime-600'
    },
    { 
        title: 'Contact Us', 
        description: 'Get in touch with us for any questions or feedback.', 
        href: '/contact', 
        icon: Contact, 
        category: 'Productivity',
        feature: null,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600'
    },
];

const categories = ['All', 'PDF', 'Image', 'AI / ML', 'Productivity', 'Health & Fitness'];
const statsCategories = ['PDF', 'Image', 'AI / ML', 'Productivity', 'Health & Fitness'];


export default function Home() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function fetchCounts() {
      try {
        const featureCounts = await getFeatureCounts();
        setCounts(featureCounts);
      } catch (error) {
        console.error("Failed to fetch feature counts:", error);
        const initialCounts: Record<string, number> = {
            smartProduct: 0,
            aiMath: 0,
            qrGenerator: 0,
            ocr: 0,
            mergePdf: 0,
            imageExcel: 0,
            imageToWebp: 0,
            imgRemoveBg: 0,
            imgChangeBg: 0,
            resizeCropImage: 0,
            logoMaker: 0,
            pdfCompress: 0,
            benefitPay: 0,
            bmiCalculator: 0,
            bmrCalculator: 0,
            fitnessMentor: 0,
            splitPdf: 0,
            weightLoss: 0,
            scientificCalculator: 0,
            unitConverter: 0,
        };
        setCounts(initialCounts);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  const filteredTools = tools.filter(tool => {
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) || tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = useMemo(() => {
    if (!counts) return {};
    return statsCategories.reduce((acc, category) => {
      const categoryTools = tools.filter(tool => tool.category === category && tool.feature);
      const total = categoryTools.reduce((sum, tool) => sum + (counts[tool.feature!] || 0), 0);
      acc[category] = total;
      return acc;
    }, {} as Record<string, number>);
  }, [counts]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">Leo Creator</span>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant="ghost">Sign In</Button>
          <Button>Sign Up</Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full pt-6 pb-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col justify-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="font-headline text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl leading-snug sm:leading-tight md:leading-tight">
                  Boost Your Productivity with Our <span className="bg-accent text-accent-foreground px-4 py-1 rounded-lg">Free Tools</span>
                </h1>
                <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Streamline your workflow with a suite of powerful, easy-to-use online utilities.
                </p>
              </div>
              <div className="mx-auto w-full max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="search"
                    placeholder="Search from 30+ tools.."
                    className="w-full rounded-full bg-muted py-6 pl-12 pr-4 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-center flex-wrap gap-2">
                {categories.map(category => (
                    <Button 
                        key={category} 
                        variant={activeCategory === category ? 'default' : 'outline'}
                        onClick={() => setActiveCategory(category)}
                        className='rounded-full'
                    >
                        {category} Tools
                    </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 pb-12 bg-muted/20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredTools.map((tool) => (
                    <Link key={tool.title} href={tool.href} className="h-full block group">
                        <Card className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg h-full">
                          <CardContent className='p-6 flex items-start gap-4'>
                            <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                                <tool.icon className={`h-6 w-6 ${tool.textColor}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-lg">{tool.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                  {tool.description}
                              </p>
                              <div className='mt-4 flex items-center text-primary font-semibold text-sm group-hover:underline'>
                                Try Now <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    </Link>
                  ))}
                </div>
                {filteredTools.length === 0 && (
                    <div className='text-center py-16 text-muted-foreground'>
                        <h3 className='text-2xl font-bold'>No tools found</h3>
                        <p>Try adjusting your search or category filter.</p>
                    </div>
                )}
            </div>
        </section>

        <section className="w-full py-12 md:py-24">
           <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="space-y-2">
                      <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Usage Statistics</h2>
                      <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                          See how many creations have been made by the community.
                      </p>
                  </div>
              </div>
              <div className="mx-auto max-w-5xl pt-12 grid grid-cols-2 md:grid-cols-5 gap-8">
                {Object.keys(categoryCounts).map(category => (
                    <div key={category} className='text-center'>
                        <div className="text-4xl font-bold text-primary">
                            {loading ? <Skeleton className='h-10 w-24 mx-auto' /> : (categoryCounts[category] ?? 0)}
                        </div>
                        <p className='text-muted-foreground'>{category}</p>
                    </div>
                ))}
              </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

    



    


    