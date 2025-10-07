
'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, ClipboardCheck, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const JavascriptBeautifier = () => {
  const [jsInput, setJsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formattedJs = useMemo(() => {
    if (!jsInput.trim()) {
      setError(null);
      return '';
    }
    try {
      // A more robust, line-by-line formatting approach
      const lines = jsInput.replace(/\r\n/g, '\n').split('\n');
      let indentLevel = 0;
      const indentChar = '  '; // 2 spaces
      let formattedCode = '';
      let inBlockComment = false;

      lines.forEach(line => {
        let trimmedLine = line.trim();

        if (trimmedLine.startsWith('/*')) {
          inBlockComment = true;
        }

        if (trimmedLine.endsWith('*/')) {
          inBlockComment = false;
        }
        
        if (!inBlockComment) {
          if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
        }

        if (trimmedLine) {
          formattedCode += indentChar.repeat(indentLevel) + trimmedLine + '\n';
        } else {
          formattedCode += '\n';
        }
        
        if (!inBlockComment) {
          if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
            indentLevel++;
          }
        }
      });
      
      setError(null);
      return formattedCode.replace(/\n\n+/g, '\n').trim();
    } catch (e) {
      setError('Could not format JavaScript. Please check for syntax errors.');
      return jsInput;
    }
  }, [jsInput]);


  const handleCopy = () => {
    if (!formattedJs || error) {
      toast({
        variant: 'destructive',
        title: 'Cannot copy',
        description: 'There is no valid JavaScript to copy.',
      });
      return;
    }
    navigator.clipboard.writeText(formattedJs).then(() => {
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setJsInput('');
    setError(null);
  };

  return (
    <div className="mt-8 grid md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Input JavaScript</h3>
        <Textarea
          value={jsInput}
          onChange={(e) => setJsInput(e.target.value)}
          placeholder="Paste your JavaScript code here..."
          className="h-[60vh] font-mono text-sm resize-none"
        />
      </div>
      <div className="flex flex-col gap-4">
         <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Beautified Output</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!formattedJs || !!error}>
                {copied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
            </Button>
          </div>
        </div>
        <Card className="h-[60vh] flex flex-col">
            <ScrollArea className="flex-1">
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
                <code>
                  {formattedJs ? formattedJs : 
                    <span className="text-muted-foreground">Your formatted JavaScript will appear here.</span>
                  }
                </code>
              </pre>
            </ScrollArea>
             {error && (
                <div className="p-2 border-t text-xs text-destructive bg-destructive/10">
                    {error}
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};

export default JavascriptBeautifier;
