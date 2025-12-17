
'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LoaderCircle, UploadCloud, File, Trash2, Globe, FileText } from 'lucide-react';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

export default function HtmlConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('htmlConverter' as any);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `Please upload a valid Word, Excel, or PDF file.` });
      return;
    }

    setFile(selectedFile);
    setUrl('');
  };
  
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setFile(null);
  }

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
    if (!file && !url) {
      toast({ variant: "destructive", title: "No source provided", description: "Please upload a file or enter a URL." });
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
        let requestBody;

        if (file) {
            const dataUri = await getBase64(file);
            requestBody = { source: 'file', dataUri, fileName: file.name };
        } else {
            requestBody = { source: 'url', url };
        }
        
        const response = await fetch('/api/html-converter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Conversion failed.');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = "converted.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

        toast({
          title: "Conversion Successful!",
          description: `Your HTML package has been downloaded.`
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file"><FileText className="mr-2 h-4 w-4" /> From File</TabsTrigger>
                <TabsTrigger value="url"><Globe className="mr-2 h-4 w-4" /> From URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
                <Card 
                    className="relative flex justify-center rounded-lg border-2 border-dashed border-input px-6 py-10 mt-4 hover:border-primary/50 transition-colors cursor-pointer shadow-inner"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4 flex text-lg leading-6 text-muted-foreground">
                        <span className="font-semibold text-primary">
                        Upload a document
                        </span>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-sm leading-5 text-muted-foreground/80">Word, Excel, or PDF</p>
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
            </TabsContent>
            <TabsContent value="url">
                <Card className="mt-4 shadow-lg">
                    <CardContent className="p-6">
                        <label htmlFor="url" className="text-sm font-medium">Website URL</label>
                        <Input id="url" type="url" placeholder="https://example.com" value={url} onChange={handleUrlChange} className="mt-2" />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

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

        <Button onClick={handleConvert} disabled={isLoading || (!file && !url)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
            {isLoading ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Converting...</> : 'Convert to HTML'}
        </Button>
    </div>
  );
}
