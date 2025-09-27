
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Download, WandSparkles, Trash2, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const PRESET_COLORS = ['#FFFFFF', '#000000', '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ChangeBackground() {
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<{file: File, previewUrl: string} | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('imgChangeBg');

  const resetState = () => {
    setIsLoading(false);
    if (originalImage) URL.revokeObjectURL(originalImage.previewUrl);
    setOriginalImage(null);
    setProcessedImage(null);
    setBgColor('#FFFFFF');
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: `File exceeds the 10MB size limit.` });
      return;
    }
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

    setIsLoading(true);
    setProcessedImage(null);

    try {
      const base64Image = await getBase64(originalImage.file);
      
      const response = await fetch('/api/image-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'change-background',
          imageDataUri: base64Image,
          backgroundColor: bgColor,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      const result = await response.json();
      
      setProcessedImage(result.imageDataUri!);
      toast({ title: "Background Changed", description: "Your image has been processed." });
      incrementUsage();
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
    link.download = `${name}_bg-changed.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <div>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>1. Upload Image</CardTitle>
            </CardHeader>
            <CardContent>
                <div 
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
                    <p className="text-sm leading-5 text-muted-foreground/80">PNG, JPG, WEBP up to 10MB</p>
                    <input 
                        id="file-upload" 
                        type="file" 
                        className="sr-only"
                        ref={fileInputRef}
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        onChange={handleFileChange}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="mt-8 shadow-lg">
            <CardHeader>
                <CardTitle>2. Choose Background Color</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <Palette className="h-6 w-6 text-muted-foreground" />
                <div className='flex gap-2 items-center'>
                    {PRESET_COLORS.map(color => (
                        <button key={color} onClick={() => setBgColor(color)} className='h-8 w-8 rounded-full border-2' style={{backgroundColor: color, borderColor: bgColor === color ? 'hsl(var(--primary))' : 'transparent'}}/>
                    ))}
                </div>
                <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-16 p-1"/>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Button onClick={handleProcess} disabled={isLoading || !originalImage} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Processing...</> : <><WandSparkles className="mr-2 h-5 w-5" />Change Background</>}
            </Button>
            <Button onClick={downloadImage} disabled={!processedImage} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download Image
            </Button>
         </div>

        {(originalImage || processedImage) && (
            <Button variant="outline" onClick={resetState} className="mt-4 w-full">
                <Trash2 className="mr-2 h-4 w-4" /> Start Over
            </Button>
        )}
      </div>

      <div className='space-y-4'>
        <Card className="shadow-lg h-full">
            <CardHeader>
                <CardTitle>Image Preview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 h-full">
                <div className="space-y-2">
                    <h3 className="text-center font-medium">Original</h3>
                    <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted/20 flex items-center justify-center">
                        {originalImage ? <Image src={originalImage.previewUrl} alt="Original image preview" fill objectFit="contain" /> : <p className="text-muted-foreground text-sm">Upload an image</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-center font-medium">Result</h3>
                    <div className="relative aspect-video w-full rounded-md overflow-hidden border flex items-center justify-center" style={{backgroundColor: processedImage ? bgColor : 'hsl(var(--muted)/0.2)'}}>
                        {isLoading && <LoaderCircle className="h-8 w-8 animate-spin text-primary" />}
                        {processedImage && !isLoading && <Image src={processedImage} alt="Processed image" fill objectFit="contain" />}
                         {!processedImage && !isLoading && <p className="text-muted-foreground text-sm">Your result will appear here</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
