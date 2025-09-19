"use client";

import { useState, useRef, useCallback } from 'react';
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { extractTextFromImageAction } from '@/app/actions';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Clipboard, ClipboardCheck, Code, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from './ui/skeleton';

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
  const { toast } = useToast();

  const handleImageProcess = useCallback(async (file: File) => {
    setIsLoading(true);
    setExtractedData(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const imagePreviewUrl = URL.createObjectURL(file);
    setImagePreview(imagePreviewUrl);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      try {
        const result = await extractTextFromImageAction(base64Image);
        if ('error' in result) {
          throw new Error(result.error);
        }
        setExtractedData(result as ExtractedData);
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
    };

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Image Read Failed",
        description: "Could not read the selected image file.",
      });
      setIsLoading(false);
    };
  }, [toast, imagePreview]);

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
  
  const LoadingState = () => (
     <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Card className="shadow-lg p-6 flex flex-col items-center justify-center">
            {imagePreview && (
                <div className="relative w-full h-full min-h-[300px] rounded-md overflow-hidden border">
                    <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="contain" />
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
              <Image src={imagePreview} alt="Original input" layout="fill" objectFit="contain" />
            </div>
          </Card>
          <Card className="shadow-lg p-4 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className='flex justify-between items-center mb-2'>
                    <TabsList>
                        <TabsTrigger value="styled"><Code className='mr-2 h-4 w-4' /> Styled HTML</TabsTrigger>
                        <TabsTrigger value="plain"><FileText className='mr-2 h-4 w-4' /> Plain Text</TabsTrigger>
                    </TabsList>
                    <Button variant="outline" onClick={handleCopy}>
                        {copied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
                <TabsContent value="styled" className="h-full">
                    <Card className='h-full'>
                        <CardContent className='p-4 h-full overflow-auto max-h-[75vh]'>
                            <div dangerouslySetInnerHTML={{ __html: extractedData.styledHtml }} />
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
  );
}
