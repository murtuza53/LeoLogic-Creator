
"use client";

import { useState, useRef, useCallback } from 'react';
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { extractTextFromImageAction } from '@/app/actions';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Clipboard, ClipboardCheck, Code, FileText, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from './ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph } from 'docx';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';


const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

type ExtractedData = {
  plainText: string;
  styledHtml: string;
};

export default function OcrProcessor() {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [activeTab, setActiveTab] = useState('styled');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styledContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('ocr');
  
  const getBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleImageProcess = useCallback(async (file: File) => {
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setExtractedData(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const imagePreviewUrl = URL.createObjectURL(file);
    setImagePreview(imagePreviewUrl);

    try {
      const base64Image = await getBase64(file);
      const result = await extractTextFromImageAction(base64Image);
      if ('error' in result) {
        throw new Error(result.error);
      }
      setExtractedData(result as ExtractedData);
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "There was an issue extracting text from the image. Please try again.",
      });
      setImagePreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast, imagePreview, router, checkLimit, incrementUsage, isUserLoading]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: `Max file size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Only image files are accepted." });
      return;
    }
    handleImageProcess(file);
  };

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageProcess(file);
        }
        break;
      }
    }
  }, [handleImageProcess]);
  
  const handleCopy = () => {
    const contentToCopy = activeTab === 'styled' ? extractedData?.styledHtml : extractedData?.plainText;
    if (!contentToCopy) return;

    navigator.clipboard.writeText(contentToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard!" });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy text to clipboard." });
    });
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (format: 'txt' | 'html' | 'pdf' | 'docx') => {
    if (!extractedData) return;

    const fileName = `extracted_content_${new Date().toISOString()}`;

    if (format === 'txt') {
      const blob = new Blob([extractedData.plainText], { type: 'text/plain' });
      downloadFile(blob, `${fileName}.txt`);
    } else if (format === 'html') {
      const blob = new Blob([extractedData.styledHtml], { type: 'text/html' });
      downloadFile(blob, `${fileName}.html`);
    } else if (format === 'pdf') {
      if (styledContentRef.current) {
        const canvas = await html2canvas(styledContentRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasHeight / canvasWidth;
        let imgHeight = pdfWidth * ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        pdf.save(`${fileName}.pdf`);
      }
    } else if (format === 'docx') {
      const doc = new Document({
        sections: [{
          children: extractedData.plainText.split('\n').map(p => new Paragraph(p)),
        }],
      });
      const blob = await Packer.toBlob(doc);
      downloadFile(blob, `${fileName}.docx`);
    }
  };
  
  const LoadingState = () => (
     <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Card className="shadow-lg p-6 flex flex-col items-center justify-center">
            {imagePreview && (
                <div className="relative w-full h-full min-h-[300px] rounded-md overflow-hidden border">
                    <Image src={imagePreview} alt="Image preview" fill className="object-contain" />
                </div>
            )}
        </Card>
        <Card className="shadow-lg p-6">
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <br />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
             <div className="flex items-center justify-center py-16">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
              </div>
        </Card>
    </div>
  );

  return (
    <>
      <div className="mt-8" onPaste={handlePaste}>
        {!imagePreview && (
          <Card 
            className="relative mt-2 flex justify-center rounded-lg border-2 border-dashed border-input px-6 py-20 hover:border-primary/50 transition-colors cursor-pointer shadow-inner"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4 flex text-lg leading-6 text-muted-foreground">
                <span className="font-semibold text-primary">
                  Upload a file
                </span>
                <p className="pl-1">, paste an image, or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">PNG, JPG, GIF, WEBP up to 10MB</p>
              <input 
                  id="file-upload" 
                  type="file" 
                  className="sr-only"
                  ref={fileInputRef}
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={handleImageChange}
                />
            </div>
          </Card>
        )}

        {isLoading && <LoadingState />}

        {!isLoading && imagePreview && extractedData && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in-50">
            <Card className="shadow-lg p-4">
              <p className='text-sm font-semibold text-muted-foreground mb-2'>Original Image</p>
              <div className="relative w-full min-h-[400px] max-h-[80vh] rounded-md overflow-hidden border">
                <Image src={imagePreview} alt="Original input" fill className="object-contain" />
              </div>
            </Card>
            <Card className="shadow-lg p-4 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className='flex justify-between items-center mb-2'>
                      <TabsList>
                          <TabsTrigger value="styled"><Code className='mr-2 h-4 w-4' /> Styled HTML</TabsTrigger>
                          <TabsTrigger value="plain"><FileText className='mr-2 h-4 w-4' /> Plain Text</TabsTrigger>
                      </TabsList>
                      <div className='flex items-center gap-2'>
                        <Button variant="outline" onClick={handleCopy}>
                            {copied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDownload('txt')}>Download as TXT</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload('html')}>Download as HTML</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload('pdf')}>Download as PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload('docx')}>Download as Word (.docx)</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  </div>
                  <TabsContent value="styled" className="h-full">
                      <Card className='h-full'>
                          <CardContent className='p-4 h-full overflow-auto max-h-[75vh]'>
                              <div ref={styledContentRef} dangerouslySetInnerHTML={{ __html: extractedData.styledHtml }} />
                          </CardContent>
                      </Card>
                  </TabsContent>
                  <TabsContent value="plain" className="h-full">
                      <Card className='h-full'>
                          <CardContent className='p-4 h-full'>
                              <pre className="whitespace-pre-wrap text-sm text-foreground overflow-auto max-h-[75vh]">{extractedData.plainText}</pre>
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

    

    
