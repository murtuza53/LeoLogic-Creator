"use client";

import { useState, useRef, useCallback } from 'react';
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { extractTableAndGenerateExcelAction } from '@/app/actions';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export default function TableExtractor() {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('imageExcel');
  
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

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const imagePreviewUrl = URL.createObjectURL(file);
    setImagePreview(imagePreviewUrl);

    try {
      const base64Image = await getBase64(file);
      const result = await extractTableAndGenerateExcelAction(base64Image);
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.message) {
          toast({
              title: "Extraction Info",
              description: result.message,
          });
      }

      if (result.excelDataUri) {
        const link = document.createElement('a');
        link.href = result.excelDataUri;
        link.download = `extracted_table_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Success!",
          description: "Your Excel file has been downloaded.",
        });
      }
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "There was an issue creating the Excel file. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, imagePreview, router, checkLimit, incrementUsage, isUserLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <>
      <div className="mt-8 grid gap-8" onPaste={handlePaste}>
        <Card 
          className="relative flex justify-center rounded-lg border-2 border-dashed border-input px-6 py-10 hover:border-primary/50 transition-colors cursor-pointer shadow-inner"
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
            <p className="text-sm leading-5 text-muted-foreground/80">PNG, JPG, GIF, WEBP up to 50MB</p>
            <input 
                id="file-upload" 
                type="file" 
                className="sr-only"
                ref={fileInputRef}
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
              />
          </div>
        </Card>

        {imagePreview && (
          <Card className="shadow-lg animate-in fade-in-50">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-4">Image Preview</h3>
              <div className="relative w-full max-w-md mx-auto aspect-video rounded-md overflow-hidden border">
                <Image src={imagePreview} alt="Image preview" fill objectFit="contain" />
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
              Analyzing & Generating Excel...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Analyze and Download Excel
            </>
          )}
        </Button>
      </div>
    </>
  );
}
