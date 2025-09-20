"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { extractImagesFromPdfAction } from '@/app/actions';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, FileImage, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

export default function PdfImageExtractor() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: `File exceeds the 20MB size limit.` });
      return;
    }
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `Only PDF files are accepted.` });
      return;
    }
    
    setFile(selectedFile);
    setExtractedImages([]);
  };

  const handleExtract = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a PDF file to extract images from.",
      });
      return;
    }

    setIsLoading(true);
    setExtractedImages([]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        const result = await extractImagesFromPdfAction(dataUri);

        if (result.error) {
            toast({
              variant: "destructive",
              title: "Extraction Failed",
              description: result.error,
            });
            setIsLoading(false);
            return;
        }
        
        if (result.images && result.images.length > 0) {
          setExtractedImages(result.images);
           toast({
            title: "Extraction Successful",
            description: `${result.images.length} image(s) were found and extracted.`,
           });
        } else {
          toast({
            title: "No Images Found",
            description: "We couldn't find any images in the selected PDF.",
          });
        }
        router.refresh();
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected PDF file.",
        });
        setIsLoading(false);
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const downloadImage = (dataUri: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `extracted_image_${index + 1}.jpg`;
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
            {file ? (
              <span className="font-semibold text-primary">{file.name}</span>
            ) : (
              <>
                <span className="font-semibold text-primary">Upload a PDF file</span>
                <p className="pl-1">or drag and drop</p>
              </>
            )}
          </div>
          <p className="text-sm leading-5 text-muted-foreground/80">PDF up to 20MB</p>
          <input
            id="file-upload"
            type="file"
            className="sr-only"
            ref={fileInputRef}
            accept={ACCEPTED_FILE_TYPES.join(',')}
            onChange={handleFileChange}
          />
        </div>
      </Card>

      <Button onClick={handleExtract} disabled={isLoading || !file} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
        {isLoading ? (
          <>
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Extracting...
          </>
        ) : (
          <>
            <FileImage className="mr-2 h-5 w-5" />
            Extract Images
          </>
        )}
      </Button>

      {extractedImages.length > 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Extracted Images ({extractedImages.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {extractedImages.map((imageUri, index) => (
                <div key={index} className="group relative border rounded-md overflow-hidden aspect-square">
                  <Image src={imageUri} alt={`Extracted Image ${index + 1}`} layout="fill" objectFit="cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon" onClick={() => downloadImage(imageUri, index)}>
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
