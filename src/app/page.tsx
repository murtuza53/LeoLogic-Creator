
"use client";

import { useState, useMemo, useEffect } from 'react';
import { ArrowRight, Calculator, Library, LogOut, QrCode, ScanText, FileJson, Image as ImageIcon, FileSpreadsheet, Eraser, Palette, Crop, Search, Brush, FileArchive, HeartPulse, MessageCircle, SplitSquareHorizontal, Flame, Scale, Blend, Component, FileUp, Scissors, Share2, Type, BrainCircuit, Bot, Merge, Sigma, UnfoldHorizontal, Minus, Weight, Users, Star, Zap, Clock, Wand2, SmilePlus, StretchHorizontal, FileImage, FileText as FileTextIcon, CheckCircle, FileCode, Braces, Table, Key, Atom, TestTube, Wind } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Footer from '@/components/footer';
import { useAuth, useUser, signOutUser } from '@/firebase';
import { type Feature } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tools = [
    { 
        title: 'Smart Product Content', 
        description: 'Generate unique, SEO-friendly product descriptions and specs.', 
        href: '/creator', 
        category: 'AI / ML',
        feature: 'smartProduct' as Feature,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        icon: BrainCircuit,
    },
    { 
        title: 'AI Math Solver', 
        description: 'Get step-by-step solutions to complex math problems.', 
        href: '/math-solver', 
        category: 'AI / ML',
        feature: 'aiMath' as Feature,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: Sigma,
    },
    { 
        title: 'Advanced Word Counter', 
        description: 'Analyze text with detailed stats and AI-powered insights.', 
        href: '/advanced-word-counter', 
        category: 'AI / ML',
        feature: 'advancedWordCounter' as Feature,
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600',
        icon: FileTextIcon,
    },
    { 
        title: 'Graphing Calculator', 
        description: 'Visualize functions, plot data, and explore equations.', 
        href: '/graphing-calculator', 
        category: 'Education',
        feature: 'graphingCalculator' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: Sigma,
    },
    { 
        title: 'Projectile Motion', 
        description: 'Simulate projectile trajectories with adjustable parameters.', 
        href: '/projectile-motion', 
        category: 'Education',
        feature: 'projectileMotion' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: Wind,
    },
    { 
        title: 'Pendulum Dynamics', 
        description: 'Explore the physics of a simple pendulum in motion.', 
        href: '/pendulum-dynamics', 
        category: 'Education',
        feature: 'pendulumDynamics' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: TestTube,
    },
    { 
        title: 'Circuit Building', 
        description: 'Design and test virtual electrical circuits.', 
        href: '/circuit-builder', 
        category: 'Education',
        feature: 'circuitBuilding' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: Atom,
    },
    { 
        title: 'Optics Lab', 
        description: 'Experiment with lenses, mirrors, and light rays.', 
        href: '/optics-lab', 
        category: 'Education',
        feature: 'opticsLab' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: Blend,
    },
    { 
        title: 'JSON Beautifier', 
        description: 'Format and color-code JSON data for readability.', 
        href: '/json-beautifier', 
        category: 'Productivity',
        feature: 'jsonBeautifier' as Feature,
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        icon: FileJson,
    },
    { 
        title: 'CSS Beautifier', 
        description: 'Format and color-code CSS data for readability.', 
        href: '/css-beautifier', 
        category: 'Productivity',
        feature: 'cssBeautifier' as Feature,
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-600',
        icon: Brush,
    },
    { 
        title: 'HTML Beautifier', 
        description: 'Format and color-code HTML code for readability.', 
        href: '/html-beautifier', 
        category: 'Productivity',
        feature: 'htmlBeautifier' as Feature,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        icon: FileCode,
    },
    { 
        title: 'JavaScript Beautifier', 
        description: 'Format and color-code JavaScript code for readability.', 
        href: '/javascript-beautifier', 
        category: 'Productivity',
        feature: 'javascriptBeautifier' as Feature,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600',
        icon: Braces,
    },
    { 
        title: 'QR Code Generator', 
        description: 'Create and customize QR codes for any text or URL.', 
        href: '/qr-generator', 
        category: 'Productivity',
        feature: 'qrGenerator' as Feature,
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        icon: QrCode,
    },
    { 
        title: 'Benefit Pay QR', 
        description: 'Generate QR codes for Benefit Pay transactions.', 
        href: '/benefit-pay-qr', 
        category: 'Productivity',
        feature: 'benefitPay' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: Share2,
    },
     { 
        title: 'Weight Loss Calculator', 
        description: 'Estimate daily calorie targets for weight loss.', 
        href: '/weight-loss-calculator', 
        category: 'Health & Fitness',
        feature: 'weightLoss' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: Minus,
    },
    { 
        title: 'Fitness Mentor', 
        description: 'Ask health and fitness questions to your AI mentor.', 
        href: '/fitness-mentor', 
        category: 'Health & Fitness',
        feature: 'fitnessMentor' as Feature,
        bgColor: 'bg-lime-100',
        textColor: 'text-lime-600',
        icon: Bot,
    },
     { 
        title: 'Scientific Calculator', 
        description: 'Perform advanced mathematical calculations with ease.', 
        href: '/scientific-calculator', 
        category: 'Productivity',
        feature: 'scientificCalculator' as Feature,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: Calculator,
    },
    { 
        title: 'Unit Converter', 
        description: 'Convert between various units of measurement.', 
        href: '/unit-converter', 
        category: 'Productivity',
        feature: 'unitConverter' as Feature,
        bgColor: 'bg-zinc-100',
        textColor: 'text-zinc-600',
        icon: UnfoldHorizontal,
    },
    { 
        title: 'OCR', 
        description: 'Extract text and its original formatting from any image.', 
        href: '/ocr', 
        category: 'AI / ML',
        feature: 'ocr' as Feature,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        icon: Type,
    },
    { 
        title: 'Excel to JSON', 
        description: 'Convert Excel files to structured JSON data.', 
        href: '/excel-to-json', 
        category: 'Productivity',
        feature: 'excelToJson' as Feature,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: Table,
    },
    { 
        title: 'JSON to Excel', 
        description: 'Convert JSON files to structured Excel data.', 
        href: '/json-to-excel', 
        category: 'Productivity',
        feature: 'jsonToExcel' as Feature,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: FileSpreadsheet,
    },
    { 
        title: 'CSV to JSON', 
        description: 'Convert CSV files to structured JSON data.', 
        href: '/csv-to-json', 
        category: 'Productivity',
        feature: 'csvToJson' as Feature,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: FileUp,
    },
    { 
        title: 'JSON to CSV', 
        description: 'Convert JSON files to structured CSV data.', 
        href: '/json-to-csv', 
        category: 'Productivity',
        feature: 'jsonToCsv' as Feature,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: FileUp,
    },
    { 
        title: 'Image to WebP', 
        description: 'Convert images to the efficient WebP format.', 
        href: '/image-to-webp', 
        category: 'Image',
        feature: 'imageToWebp' as Feature,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600',
        icon: ImageIcon,
    },
    { 
        title: 'Image to Icon', 
        description: 'Convert images to ICO format for favicons.', 
        href: '/image-to-icon', 
        category: 'Image',
        feature: 'imageToIcon' as Feature,
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600',
        icon: FileImage,
    },
    { 
        title: 'Remove Background', 
        description: 'Automatically remove an image\'s background.', 
        href: '/remove-background', 
        category: 'Image',
        feature: 'imgRemoveBg' as Feature,
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-600',
        icon: Eraser,
    },
    {
        title: 'Change Background', 
        description: 'Replace an image\'s background with a solid color.', 
        href: '/change-background', 
        category: 'Image',
        feature: 'imgChangeBg' as Feature,
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        icon: Blend,
    },
    { 
        title: 'Resize & Crop', 
        description: 'Resize and crop images to a perfect square.', href: '/resize-crop-image', 
        category: 'Image',
        feature: 'resizeCropImage' as Feature,
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-600',
        icon: Crop,
    },
    { 
        title: 'Resize Image', 
        description: 'Resize images to specific dimensions.', 
        href: '/resize-image', 
        category: 'Image',
        feature: 'resizeImage' as Feature,
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-600',
        icon: StretchHorizontal,
    },
     { 
        title: 'PDF to Word', 
        description: 'Convert PDF files to editable Word documents.', 
        href: '/pdf-to-word', 
        category: 'PDF',
        feature: 'pdfToWord' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: FileTextIcon,
    },
    { 
        title: 'Merge PDFs', 
        description: 'Combine multiple PDF documents into a single file.', 
        href: '/pdf-merger', 
        category: 'PDF',
        feature: 'mergePdf' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: Merge,
    },
    { 
        title: 'PDF Compress', 
        description: 'Reduce the file size of your PDF files.', 
        href: '/pdf-compress', 
        category: 'PDF',
        feature: 'pdfCompress' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: FileArchive,
    },
    { 
        title: 'Split PDF', 
        description: 'Split a PDF into individual pages.', 
        href: '/split-pdf', 
        category: 'PDF',
        feature: 'splitPdf' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: Scissors,
    },
    { 
        title: 'Image to Excel', 
        description: 'Extract tabular data from images and export to Excel.', 
        href: '/table-extractor', 
        category: 'PDF',
        feature: 'imageExcel' as Feature,
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600',
        icon: FileSpreadsheet,
    },
    { 
        title: 'Icon Maker', 
        description: 'Generate unique icon concepts with AI.', 
        href: '/icon-maker', 
        category: 'AI / ML',
        feature: 'logoMaker' as Feature,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: Component,
    },
    { 
        title: 'BMI Calculator', 
        description: 'Calculate your Body Mass Index with a visual gauge.', 
        href: '/bmi-calculator', 
        category: 'Health & Fitness',
        feature: 'bmiCalculator' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: HeartPulse,
    },
    { 
        title: 'BMR Calculator', 
        description: 'Calculate your Basal Metabolic Rate and daily calorie needs.', 
        href: '/bmr-calculator', 
        category: 'Health & Fitness',
        feature: 'bmrCalculator' as Feature,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: Flame,
    },
    { 
        title: 'Color Code Generator', 
        description: 'Extract palettes, pick colors, and convert color codes.', 
        href: '/color-code-generator', 
        category: 'Productivity',
        feature: 'colorCodeGenerator' as Feature,
        bgColor: 'bg-fuchsia-100',
        textColor: 'text-fuchsia-600',
        icon: Palette,
    },
    { 
        title: 'Encrypt / Decrypt Text', 
        description: 'Securely encrypt and decrypt text with a PIN.', 
        href: '/encrypt-decrypt', 
        category: 'Productivity',
        feature: 'encryptDecrypt' as Feature,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-600',
        icon: Key,
    },
];

const features = [
    {
      icon: Users,
      title: 'Complete Privacy',
      description: 'Your files are processed locally in your browser. No uploads, no storage, no privacy risks. Your data stays completely private.',
      bgColor: 'bg-purple-100 dark:bg-purple-900/50',
      textColor: 'text-purple-600 dark:text-purple-300',
    },
    {
      icon: Star,
      title: 'All-In-One Platform',
      description: 'Consolidate your workflow with a comprehensive suite of professional-grade tools, replacing dozens of single-purpose apps.',
      bgColor: 'bg-orange-100 dark:bg-orange-900/50',
      textColor: 'text-orange-600 dark:text-orange-300',
    },
    {
      icon: Zap,
      title: 'Blazing-Fast Speed',
      description: 'Get results in seconds, not minutes. Convert images instantly and compress large files without frustrating wait times.',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      textColor: 'text-green-600 dark:text-green-300',
    },
    {
      icon: Clock,
      title: 'Works Everywhere',
      description: 'Access your complete toolkit from any browser, on any device. Perfect for quick edits on the go, whether on mobile or desktop.',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      textColor: 'text-blue-600 dark:text-blue-300',
    },
    {
      icon: Wand2,
      title: 'Effortless & Intuitive',
      description: 'Achieve professional-quality results without a learning curve. Our tools are designed to be simple, intuitive, and work perfectly every time.',
      bgColor: 'bg-pink-100 dark:bg-pink-900/50',
      textColor: 'text-pink-600 dark:text-pink-300',
    },
    {
      icon: SmilePlus,
      title: 'Constantly Evolving',
      description: 'Join a growing community of satisfied users. We add fresh tools and features weekly based on valuable user feedback.',
      bgColor: 'bg-teal-100 dark:bg-teal-900/50',
      textColor: 'text-teal-600 dark:text-teal-300',
    },
];

const categories = ['All', 'PDF', 'Image', 'AI / ML', 'Productivity', 'Health & Fitness', 'Education'];


export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const filteredTools = tools.filter(tool => {
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) || tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">Leo Creator</span>
        </Link>
        <div className='flex items-center gap-4'>
           {isUserLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : user ? (
            <>
              <span className="text-sm font-medium">Welcome, {user.displayName || user.email}</span>
              <Button variant="ghost" onClick={() => signOutUser(auth)}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
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

        <section className="w-full py-12 md:py-24 bg-muted/40">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Why Choose Leo Creator?</h2>
                        <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            A complete suite of tools designed for speed, privacy, and professional results.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid gap-8 pt-12 sm:grid-cols-1 md:grid-cols-2 lg:max-w-5xl">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor} shrink-0`}>
                                <feature.icon className={`h-6 w-6 ${feature.textColor}`} />
                            </div>
                            <div>
                                <h3 className="mb-1 text-lg font-bold">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Simple and Transparent</h2>
                        <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Start free, and sign up when you need more power.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-sm gap-8 pt-12 lg:max-w-4xl lg:grid-cols-2">
                    <Card className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
                        <CardContent className="flex-1 p-6 space-y-6">
                           <div className='space-y-2'>
                                <h3 className='text-2xl font-bold'>Free</h3>
                                <p className='text-muted-foreground'>For casual use</p>
                           </div>
                           <ul className='space-y-3'>
                                <li className='flex items-center gap-3'>
                                    <CheckCircle className='h-5 w-5 text-green-500'/>
                                    <span>Limited daily usage on all tools</span>
                                </li>
                                <li className='flex items-center gap-3'>
                                    <CheckCircle className='h-5 w-5 text-green-500'/>
                                    <span>30+ Free Tools Available</span>
                                </li>
                                <li className='flex items-center gap-3'>
                                    <CheckCircle className='h-5 w-5 text-green-500'/>
                                    <span>Access to basic features</span>
                                </li>
                           </ul>
                        </CardContent>
                        <div className='p-6 pt-0'>
                             <Button asChild className='w-full' variant="outline">
                                <Link href="/signup">Get Started</Link>
                            </Button>
                        </div>
                    </Card>
                    <Card className="relative flex flex-col rounded-lg border bg-primary text-primary-foreground shadow-lg">
                        <div className="absolute top-0 right-4 -translate-y-1/2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">Popular</div>
                        <CardContent className="flex-1 p-6 space-y-6">
                           <div className='space-y-2'>
                                <h3 className='text-2xl font-bold'>Pro</h3>
                                <p className='text-primary-foreground/80'>For power users</p>
                           </div>
                           <ul className='space-y-3'>
                                <li className='flex items-center gap-3'>
                                    <CheckCircle className='h-5 w-5 text-green-300'/>
                                    <span>All Tools are Free</span>
                                </li>
                               <li className='flex items-center gap-3'>
                                    <CheckCircle className='h-5 w-5 text-green-300'/>
                                    <span>Unlimited Usage</span>
                                </li>
                                <li className='flex items-center gap-3'>
                                    <CheckCircle className='h-5 w-5 text-green-300'/>
                                    <span>Unlock advanced features</span>
                                </li>
                                <li className='flex items-center gap-3'>
                                    <CheckCircle className='h-5 w-5 text-green-300'/>
                                    <span>Priority support</span>
                                </li>
                           </ul>
                        </CardContent>
                         <div className='p-6 pt-0'>
                             <Button asChild className='w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90'>
                                <Link href="/signup">Sign Up Now</Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

    