
"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, File, Trash2, WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const ACCEPTED_FILE_TYPES = ["application/pdf"];

export default function PdfToExcel() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sheetOption, setSheetOption] = useState<'single' | 'multiple'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('pdfToExcel');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

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
  
  const getBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleConvert = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file", description: "Please upload a PDF file to convert." });
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
        const dataUri = await getBase64(file);
        
        const response = await fetch('/api/pdf-tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'pdf-to-excel',
            pdfDataUri: dataUri,
            sheetOption: sheetOption,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'PDF to Excel conversion failed.');
        }

        const actionResult = await response.json();

        if (actionResult.excelDataUri) {
          const link = document.createElement('a');
          link.href = actionResult.excelDataUri;
          link.download = `${file.name.replace('.pdf', '')}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: "Conversion Successful!",
            description: `Your Excel file has been downloaded.`
          });
        }
        
        router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
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
                  Upload PDF file
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">PDF</p>
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
                <CardTitle>Excel Sheet Options</CardTitle>
                <CardDescription>Choose how to organize the data in your Excel file.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup 
                    value={sheetOption}
                    onValueChange={(value: 'single' | 'multiple') => setSheetOption(value)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <div>
                        <RadioGroupItem value="single" id="single" className="peer sr-only" />
                        <Label htmlFor="single" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <span className="font-bold">Single Sheet</span>
                            <span className="text-sm text-muted-foreground mt-1">Combine all pages into one sheet.</span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="multiple" id="multiple" className="peer sr-only" />
                        <Label htmlFor="multiple" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                             <span className="font-bold">Multiple Sheets</span>
                            <span className="text-sm text-muted-foreground mt-1">Each PDF page gets its own sheet.</span>
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>

        <Button onClick={handleConvert} disabled={isLoading || !file} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Converting...</> : <><WandSparkles className="mr-2 h-5 w-5" />Convert to Excel</>}
        </Button>
    </div>
  );
}

    