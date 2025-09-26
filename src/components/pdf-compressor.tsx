"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { compressPdfAction } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, File, Trash2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

type CompressionResult = {
    originalSize: number;
    compressedSize: number;
    dataUri: string;
};

export default function PdfCompressor() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [result, setResult] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('pdfCompress');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: `File exceeds the 100MB size limit.` });
      return;
    }
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `File is not a PDF.` });
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const handleCompress = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file", description: "Please upload a PDF file to compress." });
      return;
    }
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const actionResult = await compressPdfAction(dataUri, compressionLevel);

        if (actionResult.error) throw new Error(actionResult.error);

        const { compressedPdfDataUri, originalSize, compressedSize } = actionResult;
        
        setResult({
            originalSize,
            compressedSize,
            dataUri: compressedPdfDataUri!,
        });

        toast({
          title: "Compression Successful!",
          description: `Reduced file size by ${Math.round(100 - (compressedSize / originalSize) * 100)}%.`
        });
        incrementUsage();
        router.refresh();
      };
      reader.onerror = () => {
        throw new Error("Failed to read the file.");
      };
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Compression Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.dataUri;
    link.download = `compressed_${file?.name || 'file.pdf'}`;
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
                  Upload PDF file
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">PDF up to 100MB</p>
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

        {file && (
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <File className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={removeFile}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}
        
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Compression Level</CardTitle>
                <CardDescription>Higher compression may reduce quality.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup 
                    defaultValue="medium" 
                    className="grid grid-cols-3 gap-4"
                    value={compressionLevel}
                    onValueChange={(value: 'low' | 'medium' | 'high') => setCompressionLevel(value)}
                >
                    <div>
                        <RadioGroupItem value="low" id="low" className="peer sr-only" />
                        <Label htmlFor="low" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Low
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="medium" id="medium" className="peer sr-only" />
                        <Label htmlFor="medium" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Medium
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="high" id="high" className="peer sr-only" />
                        <Label htmlFor="high" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            High
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>

        <Button onClick={handleCompress} disabled={isLoading || !file} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Compressing...</> : 'Compress PDF'}
        </Button>

        {result && (
            <Card className="shadow-lg animate-in fade-in-50">
                <CardHeader>
                    <CardTitle>Compression Complete!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Original Size</p>
                            <p className="text-xl font-bold">{formatBytes(result.originalSize)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Compressed Size</p>
                            <p className="text-xl font-bold text-green-600">{formatBytes(result.compressedSize)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Reduction</p>
                            <p className="text-xl font-bold text-green-600">
                                {Math.round(100 - (result.compressedSize / result.originalSize) * 100)}%
                            </p>
                        </div>
                    </div>
                    <Button onClick={downloadFile} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Compressed PDF
                    </Button>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
