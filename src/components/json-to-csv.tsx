
"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, File, Trash2, Download, TableProperties, Clipboard, ClipboardCheck } from 'lucide-react';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';
import { saveAs } from 'file-saver';
import { ScrollArea } from './ui/scroll-area';

const ACCEPTED_FILE_TYPES = ["application/json"];

export default function JsonToCsvConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('jsonToCsv');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `Please upload a valid JSON file (.json).` });
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.readAsText(selectedFile);
    reader.onload = () => {
        try {
            const content = reader.result as string;
            const parsed = JSON.parse(content);
            setJsonPreview(JSON.stringify(parsed, null, 2));
        } catch (error) {
            toast({ variant: "destructive", title: "Invalid JSON", description: "The uploaded file is not a valid JSON file."});
            setFile(null);
            setJsonPreview(null);
        }
    };
  };

  const removeFile = () => {
    setFile(null);
    setJsonPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleConvert = async () => {
    if (!file || !jsonPreview) {
      toast({ variant: "destructive", title: "No file", description: "Please upload a JSON file to convert." });
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
        const data = JSON.parse(jsonPreview);
        
        if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
            throw new Error("JSON must be an array of objects.");
        }

        const headers = Object.keys(data[0]);
        const replacer = (key: any, value: any) => value === null ? '' : value;
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${file.name.replace(/\.[^/.]+$/, "") || 'data'}.csv`);

        toast({
            title: "Conversion Successful!",
            description: `Your JSON file has been converted to CSV and downloaded.`
        });
        
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
                  Upload JSON file
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">.json</p>
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

        {file && jsonPreview && (
            <Card className="shadow-lg">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                        <div className="flex items-center gap-3 truncate">
                            <File className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(2)} KB)</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={removeFile}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        <Button onClick={handleConvert} disabled={isLoading || !file} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Converting...</> : <><TableProperties className="mr-2 h-5 w-5" />Convert to CSV</>}
        </Button>
        
        {jsonPreview && (
            <Card className="shadow-lg animate-in fade-in-50">
                <CardContent className="p-4">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">JSON Preview</h3>
                    </div>
                    <ScrollArea className="h-96 w-full rounded-md border">
                        <pre className="p-4 text-sm font-mono">{jsonPreview}</pre>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
