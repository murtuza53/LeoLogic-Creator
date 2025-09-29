"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Download, WandSparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function RemoveBackground() {
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<{file: File, previewUrl: string} | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('imgRemoveBg');

  const resetState = () => {
    setIsLoading(false);
    if (originalImage) URL.revokeObjectURL(originalImage.previewUrl);
    setOriginalImage(null);
    setProcessedImage(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `File is not a supported image type.` });
      return;
    }

    if (originalImage) URL.revokeObjectURL(originalImage.previewUrl);
    setOriginalImage({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    setProcessedImage(null);
  };
  
  const getBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleProcess = async () => {
    if (!originalImage) {
      toast({ variant: "destructive", title: "No file", description: "Please upload an image." });
      return;
    }
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setProcessedImage(null);

    try {
        const base64Image = await getBase64(originalImage.file);
        
        const response = await fetch('/api/image-tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool: 'remove-background',
                imageDataUri: base64Image,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'An unknown error occurred.');
        }

        const result = await response.json();
        
        setProcessedImage(result.imageDataUri!);
        toast({ title: "Background Removed", description: "Your image has been processed." });
        
        router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const downloadImage = () => {
    if (!processedImage || !originalImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    const name = originalImage.file.name.substring(0, originalImage.file.name.lastIndexOf('.')) || originalImage.file.name;
    link.download = `${name}_no-bg.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 grid gap-8">
      <Card 
          className="relative flex justify-center rounded-lg border-2 border-dashed border-input px-6 py-10 hover:border-primary/50 transition-colors cursor-pointer shadow-inner"
          onClick={() => fileInputRef.current?.click()}
      >
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4 flex text-lg leading-6 text-muted-foreground">
              <span className="font-semibold text-primary">
                Upload an image
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-sm leading-5 text-muted-foreground/80">PNG, JPG, WEBP</p>
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

      {(originalImage || processedImage) && (
        <Card className="shadow-lg">
          <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
            {originalImage && (
              <div className="space-y-2">
                <h3 className="text-center font-medium">Original</h3>
                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                    <Image src={originalImage.previewUrl} alt="Original image preview" fill className="object-contain" />
                </div>
              </div>
            )}
            <div className='space-y-2'>
                <h3 className="text-center font-medium">Result</h3>
                <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3C/svg%3E')]">
                    {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-muted/20"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>}
                    {processedImage && (
                        <Image src={processedImage} alt="Processed image with background removed" fill className="object-contain" />
                    )}
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={handleProcess} disabled={isLoading || !originalImage} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Processing...</> : <><WandSparkles className="mr-2 h-5 w-5" />Remove Background</>}
        </Button>
        <Button onClick={downloadImage} disabled={!processedImage} className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download Image
        </Button>
      </div>

       {(originalImage || processedImage) && (
        <Button variant="outline" onClick={resetState}>
          <Trash2 className="mr-2 h-4 w-4" /> Start Over
        </Button>
      )}
    </div>
  );
}
