
'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, ClipboardCheck, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const JsonBeautifier = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formattedJson = useMemo(() => {
    if (!jsonInput.trim()) {
      setError(null);
      return null;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);
      return JSON.stringify(parsed, null, 2);
    } catch (e: any) {
      setError('Invalid JSON: ' + e.message);
      return jsonInput;
    }
  }, [jsonInput]);
  
  const syntaxHighlight = (jsonString: string | null) => {
    if (!jsonString) return null;
    if (error) return <span className="text-destructive">{jsonString}</span>;
    
    return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-green-600 dark:text-green-400'; // string
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-blue-600 dark:text-blue-400'; // key
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-purple-600 dark:text-purple-400'; // boolean
        } else if (/null/.test(match)) {
            cls = 'text-gray-500 dark:text-gray-400'; // null
        } else {
             cls = 'text-orange-600 dark:text-orange-400'; // number
        }
        return `<span class="${cls}">${match}</span>`;
    });
  };

  const handleCopy = () => {
    if (!formattedJson || error) {
      toast({
        variant: 'destructive',
        title: 'Cannot copy',
        description: 'There is no valid JSON to copy.',
      });
      return;
    }
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setJsonInput('');
    setError(null);
  };

  return (
    <div className="mt-8 grid md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Input JSON</h3>
        <Textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='Paste your JSON here...'
          className="h-[60vh] font-mono text-sm resize-none"
        />
      </div>
      <div className="flex flex-col gap-4">
         <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Beautified Output</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!formattedJson || !!error}>
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
                {formattedJson ? (
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(formattedJson) || '' }} />
                ) : (
                  <span className="text-muted-foreground">Your formatted JSON will appear here.</span>
                )}
              </pre>
            </ScrollArea>
             {error && (
                <div className='p-2 border-t text-xs text-destructive bg-destructive/10'>
                    {error}
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};

export default JsonBeautifier;
