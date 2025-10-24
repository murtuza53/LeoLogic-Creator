"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Trash2, Download, Crop } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const MAX_FILES = 3;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type ImageFile = {
  file: File;
  previewUrl: string;
};

type ProcessedImage = {
  originalName: string;
  dataUri: string;
}

export default function ResizeCropImage() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [targetSize, setTargetSize] = useState(500);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('resizeCropImage');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({ variant: "destructive", title: "File limit exceeded", description: `You can only upload up to ${MAX_FILES} images.` });
      return;
    }

    const newFiles: ImageFile[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: `File "${file.name}" is not a supported image type.` });
        continue;
      }
      newFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const imageElement = new window.Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        imageElement.src = e.target?.result as string;
      };

      imageElement.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Could not get canvas context"));

        canvas.width = targetSize;
        canvas.height = targetSize;

        // Draw image centered and cropped
        const sourceWidth = imageElement.naturalWidth;
        const sourceHeight = imageElement.naturalHeight;
        const sourceAspectRatio = sourceWidth / sourceHeight;
        const targetAspectRatio = 1; // Square

        let drawWidth, drawHeight, x, y;

        if (sourceAspectRatio > targetAspectRatio) {
          // Wider than target, crop sides
          drawHeight = sourceHeight;
          drawWidth = sourceHeight * targetAspectRatio;
          x = (sourceWidth - drawWidth) / 2;
          y = 0;
        } else {
          // Taller than target, crop top/bottom
          drawWidth = sourceWidth;
          drawHeight = sourceWidth / targetAspectRatio;
          x = 0;
          y = (sourceHeight - drawHeight) / 2;
        }

        ctx.drawImage(imageElement, x, y, drawWidth, drawHeight, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL('image/png')); // Use PNG to preserve transparency
      };

      imageElement.onerror = () => reject(new Error("Could not load image"));
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({ variant: "destructive", title: "No files", description: "Please upload at least one image." });
      return;
    }
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setProcessedImages([]);

    try {
      const processingPromises = files.map(imageFile => processImage(imageFile.file));
      const results = await Promise.all(processingPromises);
      
      const namedProcessedImages = results.map((dataUri, index) => ({
          originalName: files[index].file.name,
          dataUri,
      }));

      setProcessedImages(namedProcessedImages);
      toast({ title: "Processing Successful", description: "Your images have been processed." });
      router.refresh();

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during processing.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadImage = (dataUri: string, originalName: string) => {
    const link = document.createElement('a');
    link.href = dataUri;
    const name = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    link.download = `${name}_${targetSize}x${targetSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="mt-8 grid gap-8">
        <Card 
            className="relative flex justify-center rounded-lg border-2 border-dashed border-input px-6 py-10 hover:border-primary/50 transition-colors cursor-pointer shadow-inner"
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4 flex text-lg leading-6 text-muted-foreground">
                <span className="font-semibold text-primary">
                  Upload images
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">Up to ${MAX_FILES} images (PNG, JPG, WEBP)</p>
              <input 
                  id="file-upload" 
                  type="file" 
                  multiple
                  className="sr-only"
                  ref={fileInputRef}
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={handleFileChange}
                  disabled={files.length >= MAX_FILES}
                />
            </div>
        </Card>

        {files.length > 0 && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Image Queue ({files.length}/{MAX_FILES})</CardTitle>
                    <CardDescription>Review your images before processing.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map((imageFile, index) => (
                        <Card key={index} className="overflow-hidden relative">
                          <CardContent className="p-4 space-y-4">
                            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                <Image src={imageFile.previewUrl} alt={`Preview of ${imageFile.file.name}`} layout="fill" className="object-contain" />
                            </div>
                            <p className="text-sm font-medium truncate">{imageFile.file.name}</p>
                           </CardContent>
                           <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeFile(index)}>
                                <Trash2 className="h-4 w-4" />
                           </Button>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        )}
        
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Processing Options</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Label htmlFor="size-slider">Target Size: {targetSize}x{targetSize}px</Label>
                    <Slider
                        id="size-slider"
                        min={100}
                        max={1000}
                        step={50}
                        value={[targetSize]}
                        onValueChange={(vals) => setTargetSize(vals[0])}
                    />
                </div>
            </CardContent>
        </Card>


        <Button onClick={handleProcess} disabled={isLoading || files.length === 0} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? (
            <>
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                Processing...
            </>
            ) : (
            <>
                <Crop className="mr-2 h-5 w-5" />
                Resize & Crop Images
            </>
            )}
        </Button>
        
        {processedImages.length > 0 && (
             <Card className="shadow-lg animate-in fade-in-50">
                <CardHeader>
                    <CardTitle>Processed Images</CardTitle>
                    <CardDescription>Download your processed images.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {processedImages.map((image, index) => (
                        <Card key={index} className="overflow-hidden group">
                           <CardContent className="p-4 space-y-4">
                             <div className="relative aspect-square w-full rounded-md overflow-hidden border bg-white bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3C/svg%3E')]">
                                <Image src={image.dataUri} alt={`Processed ${image.originalName}`} layout="fill" className="object-contain" />
                             </div>
                              <p className="text-sm font-medium truncate">{image.originalName}</p>
                             <Button onClick={() => downloadImage(image.dataUri, image.originalName)} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download PNG
                             </Button>
                           </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        )}
      </div>
    </>
  );
}
