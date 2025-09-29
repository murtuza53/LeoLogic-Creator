"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, File, Trash2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const ACCEPTED_FILE_TYPES = ["application/pdf"];

export default function PdfMerger() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('mergePdf');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles);
    
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: "destructive", title: "File too large", description: `File "${file.name}" exceeds the 50MB size limit.` });
        return;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: `File "${file.name}" is not a PDF.` });
        return;
      }
    }
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleMerge = async () => {
    if (files.length < 2) {
        toast({
            variant: "destructive",
            title: "Not enough files",
            description: "Please upload at least two PDF files to merge.",
        });
        return;
    }
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();
    
    setIsLoading(true);

    try {
        const filePromises = files.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        });

        const dataUris = await Promise.all(filePromises);
        
        const response = await fetch('/api/pdf-tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'merge-pdf',
            pdfDataUris: dataUris,
          }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'PDF merging failed.');
        }
        
        const result = await response.json();

        if (result.mergedPdf) {
             const link = document.createElement('a');
             link.href = result.mergedPdf;
             link.download = `merged_${Date.now()}.pdf`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
        }

        toast({
            title: "Merge Successful",
            description: "Your PDF has been downloaded.",
        });
        
        
        setFiles([]);
        router.refresh();
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Merge Failed",
            description: "There was an issue merging your PDFs. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
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
                  Upload PDF files
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">PDFs up to 50MB each</p>
              <input 
                  id="file-upload" 
                  type="file" 
                  multiple
                  className="sr-only"
                  ref={fileInputRef}
                  accept={ACCEPTED_FILE_TYPES.join(',')}
                  onChange={handleFileChange}
                />
            </div>
        </Card>

        {files.length > 0 && (
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Files to Merge ({files.length})</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <File className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        <Button onClick={handleMerge} disabled={isLoading || files.length < 2} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? (
            <>
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                Merging...
            </>
            ) : (
            <>
                <Download className="mr-2 h-5 w-5" />
                Merge & Download
            </>
            )}
        </Button>
      </div>
    </>
  );
}
