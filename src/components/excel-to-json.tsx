
"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, File, Trash2, Download, TableProperties, Clipboard, ClipboardCheck } from 'lucide-react';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';
import * as ExcelJS from 'exceljs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

const ACCEPTED_FILE_TYPES = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];

export default function ExcelToJsonConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [useHeaders, setUseHeaders] = useState(true);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('excelToJson');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `Please upload a valid Excel file (.xlsx).` });
      return;
    }

    setFile(selectedFile);
    setJsonOutput(null);
  };

  const removeFile = () => {
    setFile(null);
    setJsonOutput(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleConvert = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file", description: "Please upload an Excel file to convert." });
      return;
    }
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setJsonOutput(null);

    try {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async () => {
            const buffer = reader.result as ArrayBuffer;
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            
            const worksheet = workbook.worksheets[0];
            const data: any[] = [];
            let headers: any[] = [];

            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1 && useHeaders) {
                    headers = row.values as any[];
                    // Clean up headers (ExcelJS includes an empty first element)
                    if (headers.length > 0 && headers[0] === undefined) headers.shift();
                } else {
                    const rowData: any = {};
                    const rowValues = row.values as any[];
                     if (rowValues.length > 0 && rowValues[0] === undefined) rowValues.shift();

                    if (useHeaders) {
                        headers.forEach((header, index) => {
                            rowData[header] = rowValues[index] || null;
                        });
                        data.push(rowData);
                    } else {
                        data.push(rowValues);
                    }
                }
            });

            const formattedJson = JSON.stringify(data, null, 2);
            setJsonOutput(formattedJson);
            toast({
              title: "Conversion Successful!",
              description: `Your Excel file has been converted to JSON.`
            });
            setIsLoading(false);
        };
        reader.onerror = () => {
            throw new Error("Failed to read the file.");
        }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    if (!jsonOutput) return;
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace(/\.[^/.]+$/, "") || 'data'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleCopy = () => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput).then(() => {
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    });
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
                  Upload Excel file
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-sm leading-5 text-muted-foreground/80">.xlsx or .xls</p>
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
                    <div className="flex items-center space-x-2 justify-self-center">
                        <Switch id="headers-switch" checked={useHeaders} onCheckedChange={setUseHeaders} />
                        <Label htmlFor="headers-switch">First row is header</Label>
                    </div>
                </CardContent>
            </Card>
        )}

        <Button onClick={handleConvert} disabled={isLoading || !file} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Converting...</> : <><TableProperties className="mr-2 h-5 w-5" />Convert to JSON</>}
        </Button>
        
        {jsonOutput && (
            <Card className="shadow-lg animate-in fade-in-50">
                <CardContent className="p-4">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">JSON Output</h3>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={handleCopy}>
                                {copied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                                Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={downloadJson}>
                                <Download className="mr-2 h-4 w-4" />
                                Download JSON
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="h-96 w-full rounded-md border">
                        <pre className="p-4 text-sm font-mono">{jsonOutput}</pre>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
