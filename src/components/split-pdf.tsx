"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, File, Trash2, Download, SplitSquareHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

export default function SplitPdf() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('splitPdf');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: `File exceeds the 50MB size limit.` });
      return;
    }
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `File is not a PDF.` });
      return;
    }

    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSplit = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file", description: "Please upload a PDF file to split." });
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
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const numPages = pdfDoc.getPageCount();
      
      const zip = new JSZip();

      for (let i = 0; i < numPages; i++) {
        const newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
        newDoc.addPage(copiedPage);
        const pdfBytes = await newDoc.save();
        zip.file(`${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`, pdfBytes);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${file.name.replace('.pdf', '')}_split.zip`);
      
      toast({
        title: "Split Successful!",
        description: `Your PDF has been split into ${numPages} files and downloaded as a zip.`
      });

      
      router.refresh();

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Split Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
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
                  Upload a PDF file
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">PDF up to 50MB</p>
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
                <div className="p-6">
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
                </div>
            </Card>
        )}

        <Button onClick={handleSplit} disabled={isLoading || !file} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Splitting...</> : <><SplitSquareHorizontal className="mr-2 h-5 w-5" />Split & Download ZIP</>}
        </Button>
    </div>
  );
}
