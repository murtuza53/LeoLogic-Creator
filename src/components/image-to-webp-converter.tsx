
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, Trash2, Download, WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type ImageFile = {
  file: File;
  previewUrl: string;
};

type ConvertedImage = {
  originalName: string;
  dataUri: string;
}

export default function ImageToWebpConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('imageToWebp');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({ variant: "destructive", title: "File limit exceeded", description: `You can only upload up to ${MAX_FILES} images.` });
      return;
    }

    const newFiles: ImageFile[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: "destructive", title: "File too large", description: `File "${file.name}" exceeds the 10MB size limit.` });
        continue;
      }
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

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({ variant: "destructive", title: "No files", description: "Please upload at least one image to convert." });
      return;
    }
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setConvertedImages([]);

    try {
      const imagePayloads = await Promise.all(files.map(imageFile => getBase64(imageFile.file)));

      const response = await fetch('/api/image-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'convert-to-webp',
          images: imagePayloads.map(dataUri => ({ dataUri })),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      const result = await response.json();

      if (result.convertedImages) {
        const namedConvertedImages = result.convertedImages.map((dataUri: string, index: number) => ({
          originalName: files[index].file.name,
          dataUri,
        }));
        setConvertedImages(namedConvertedImages);
        toast({ title: "Conversion Successful", description: "Your images have been converted to WebP." });
        
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during conversion.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadImage = (dataUri: string, originalName: string) => {
    const link = document.createElement('a');
    link.href = dataUri;
    const name = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    link.download = `${name}.webp`;
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
              <p className="text-sm leading-5 text-muted-foreground/80">Up to ${MAX_FILES} images (PNG, JPG, WEBP), 10MB each</p>
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
                    <CardDescription>Review your images before converting.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map((imageFile, index) => (
                        <Card key={index} className="overflow-hidden relative">
                          <CardContent className="p-4 space-y-4">
                            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                <Image src={imageFile.previewUrl} alt={`Preview of ${imageFile.file.name}`} layout="fill" objectFit="contain" />
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

        <Button onClick={handleConvert} disabled={isLoading || files.length === 0} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? (
            <>
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                Converting...
            </>
            ) : (
            <>
                <WandSparkles className="mr-2 h-5 w-5" />
                Convert to WebP
            </>
            )}
        </Button>
        
        {convertedImages.length > 0 && (
             <Card className="shadow-lg animate-in fade-in-50">
                <CardHeader>
                    <CardTitle>Converted Images</CardTitle>
                    <CardDescription>Download your converted WebP images.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {convertedImages.map((image, index) => (
                        <Card key={index} className="overflow-hidden group">
                           <CardContent className="p-4 space-y-4">
                             <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted">
                                <Image src={image.dataUri} alt={`Converted ${image.originalName}`} layout="fill" objectFit="contain" />
                             </div>
                              <p className="text-sm font-medium truncate">{image.originalName}</p>
                             <Button onClick={() => downloadImage(image.dataUri, image.originalName)} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download WebP
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

    