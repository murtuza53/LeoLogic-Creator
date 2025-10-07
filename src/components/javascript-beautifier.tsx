
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
      let indentLevel = 0;
      let result = '';
      let inString = false;
      let stringChar = '';
      let inComment: 'single' | 'multi' | false = false;
      let inRegex = false;

      // Basic cleanup
      const cleanedInput = jsInput
        .replace(/\s*([;{}(),])\s*/g, '$1')
        .replace(/\s*([=><!+\-*/&|?:]+)\s*/g, ' $1 ');

      for (let i = 0; i < cleanedInput.length; i++) {
        const char = cleanedInput[i];
        const prevChar = i > 0 ? cleanedInput[i - 1] : '';
        const nextChar = i < cleanedInput.length - 1 ? cleanedInput[i + 1] : '';

        if (inString) {
          result += char;
          if (char === stringChar && prevChar !== '\\') {
            inString = false;
          }
          continue;
        }

        if (inComment) {
          result += char;
          if ((inComment === 'single' && char === '\n') || (inComment === 'multi' && char === '/' && prevChar === '*')) {
            inComment = false;
            if (char === '\n') {
              result += '\t'.repeat(indentLevel);
            }
          }
          continue;
        }

        if (inRegex) {
          result += char;
          if (char === '/' && prevChar !== '\\') {
            inRegex = false;
          }
          continue;
        }
        
        if (char === '/' && nextChar === '/') {
          inComment = 'single';
          result += char;
          continue;
        }

        if (char === '/' && nextChar === '*') {
          inComment = 'multi';
          result += char;
          continue;
        }
        
        if (char === "'" || char === '"' || char === '`') {
          inString = true;
          stringChar = char;
          result += char;
          continue;
        }
        
        // Very basic regex detection
        const regexPreceders = ['=', '(', ',', ':', '[', '!', '&', '|', '?', '{', 'return', ' '];
        if (char === '/' && regexPreceders.includes(prevChar) && nextChar !== '/' && nextChar !== '*') {
            inRegex = true;
            result += char;
            continue;
        }

        if (char === '{' || char === '[') {
          indentLevel++;
          result += char + '\n' + '\t'.repeat(indentLevel);
        } else if (char === '}' || char === ']') {
          indentLevel = Math.max(0, indentLevel - 1);
          result = result.trimEnd() + '\n' + '\t'.repeat(indentLevel) + char;
        } else if (char === ';') {
          result += char + '\n' + '\t'.repeat(indentLevel);
        } else if (char === ',' ) {
          result += char + ' ';
        } else if (char === '\n') {
          if (result.trim().length > 0 && !result.endsWith('\n')) {
            result += '\n' + '\t'.repeat(indentLevel);
          }
        } else {
          result += char;
        }
      }
      
      setError(null);
      // Final cleanup
      return result
        .replace(/(\n\s*){2,}/g, '\n\n') // Collapse multi-blank lines
        .replace(/\n\s*}/g, '\n}') // clean up trailing spaces before }
        .replace(/\{\s*\n/g, '{\n')
        .trim();
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
                {formattedJs ? (
                  <code>{formattedJs}</code>
                ) : error ? (
                   <span className="text-destructive">{error}</span>
                ) : (
                  <span className="text-muted-foreground">Your formatted JavaScript will appear here.</span>
                )}
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
