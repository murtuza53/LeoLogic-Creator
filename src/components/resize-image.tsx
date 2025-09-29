"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Download, WandSparkles, Trash2, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ResizeImage() {
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<{file: File, previewUrl: string, width: number, height: number} | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('resizeImage');

  const resetState = () => {
    setIsLoading(false);
    if (originalImage) URL.revokeObjectURL(originalImage.previewUrl);
    setOriginalImage(null);
    setProcessedImage(null);
    setWidth('');
    setHeight('');
    setMaintainAspectRatio(true);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: `File exceeds the 50MB size limit.` });
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `File is not a supported image type.` });
      return;
    }

    if (originalImage) URL.revokeObjectURL(originalImage.previewUrl);
    
    const previewUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setOriginalImage({
        file,
        previewUrl,
        width: img.width,
        height: img.height,
      });
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = previewUrl;

    setProcessedImage(null);
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

    const targetWidth = Number(width);
    const targetHeight = Number(height);
    
    if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
        toast({ variant: "destructive", title: "Invalid Dimensions", description: "Please enter valid width and height." });
        setIsLoading(false);
        return;
    }

    const image = new window.Image();
    image.src = originalImage.previewUrl;
    image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            toast({ variant: "destructive", title: "Canvas not supported", description: "Your browser does not support the required technology." });
            setIsLoading(false);
            return;
        }

        let finalWidth = targetWidth;
        let finalHeight = targetHeight;

        if (maintainAspectRatio) {
            const originalRatio = image.width / image.height;
            // Determine the final dimensions based on the limiting factor (width or height)
            if (targetWidth / targetHeight > originalRatio) {
                finalWidth = targetHeight * originalRatio;
                finalHeight = targetHeight;
            } else {
                finalHeight = targetWidth / originalRatio;
                finalWidth = targetWidth;
            }
        }
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        ctx.drawImage(image, 0, 0, finalWidth, finalHeight);
        
        const dataUrl = canvas.toDataURL(originalImage.file.type); // Use original file type
        setProcessedImage(dataUrl);
        toast({ title: "Image Resized", description: "Your image has been processed." });
        
        router.refresh();
        setIsLoading(false);
    };
    image.onerror = () => {
        toast({ variant: "destructive", title: "Image Load Failed", description: "Could not load the image for processing." });
        setIsLoading(false);
    }
  };
  
  const downloadImage = () => {
    if (!processedImage || !originalImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    const name = originalImage.file.name.substring(0, originalImage.file.name.lastIndexOf('.')) || originalImage.file.name;
    const extension = originalImage.file.name.split('.').pop() || 'png';
    link.download = `${name}_resized.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
        setWidth("");
        if (maintainAspectRatio) setHeight("");
        return;
    }
    const newWidth = parseInt(value, 10);
    if (!isNaN(newWidth)) {
        setWidth(newWidth);
        if (maintainAspectRatio && originalImage) {
            const ratio = originalImage.height / originalImage.width;
            setHeight(Math.round(newWidth * ratio));
        }
    }
  };
  
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
        setHeight("");
        if (maintainAspectRatio) setWidth("");
        return;
    }
    const newHeight = parseInt(value, 10);
    if (!isNaN(newHeight)) {
        setHeight(newHeight);
        if (maintainAspectRatio && originalImage) {
            const ratio = originalImage.width / originalImage.height;
            setWidth(Math.round(newHeight * ratio));
        }
    }
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
                    <p className="text-sm leading-5 text-muted-foreground/80">PNG, JPG, WEBP up to 50MB</p>
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
                <CardTitle>2. Set Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className='space-y-2'>
                        <Label htmlFor='width'>Width</Label>
                        <Input id='width' type='number' value={width} onChange={handleWidthChange} />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='height'>Height</Label>
                        <Input id='height' type='number' value={height} onChange={handleHeightChange} />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="aspect-ratio" checked={maintainAspectRatio} onCheckedChange={setMaintainAspectRatio} />
                    <Label htmlFor="aspect-ratio" className='flex items-center'>
                        {maintainAspectRatio ? <Lock className="mr-2 h-4 w-4"/> : <Unlock className="mr-2 h-4 w-4" />}
                        Maintain aspect ratio
                    </Label>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Button onClick={handleProcess} disabled={isLoading || !originalImage} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Processing...</> : <><WandSparkles className="mr-2 h-5 w-5" />Resize Image</>}
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
            <CardContent className="h-full space-y-6">
                {originalImage ? (
                    <div className="space-y-2">
                        <h3 className="text-center font-medium text-muted-foreground">Original ({originalImage.width} x {originalImage.height})</h3>
                        <div className="relative aspect-video w-full rounded-md overflow-hidden border flex items-center justify-center bg-muted/10">
                            <Image src={originalImage.previewUrl} alt="Original image preview" fill className="object-contain" />
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">Upload an image to start</div>
                )}
                
                <div className="space-y-2">
                    <h3 className="text-center font-medium text-muted-foreground">Result</h3>
                    <div className="relative aspect-video w-full rounded-md overflow-hidden border flex items-center justify-center bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3C/svg%3E')]">
                        {isLoading && <LoaderCircle className="h-8 w-8 animate-spin text-primary" />}
                        {processedImage && !isLoading ? (
                            <Image src={processedImage} alt="Processed image" fill className="object-contain" />
                        ) : !isLoading && (
                             <div className="text-center text-muted-foreground p-4">Your result will appear here</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
