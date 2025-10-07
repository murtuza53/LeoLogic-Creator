
'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, ClipboardCheck, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const CssBeautifier = () => {
  const [cssInput, setCssInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formattedCss = useMemo(() => {
    if (!cssInput.trim()) {
      setError(null);
      return '';
    }

    try {
      // Basic formatting logic
      let formatted = cssInput
        .replace(/\s*([{};])\s*/g, '$1') // Normalize spaces around brackets, semicolons
        .replace(/;}/g, '}') // Remove trailing semicolons
        .replace(/([:;,])\s*/g, '$1 ') // Add space after colons, semicolons, commas
        .replace(/\s+([!{])/g, '$1')
        .replace(/, /g, ',');
      
      let indentLevel = 0;
      let result = '';
      let inComment = false;

      for (let i = 0; i < formatted.length; i++) {
        const char = formatted[i];
        
        if (formatted.substring(i, i + 2) === '/*') {
          inComment = true;
          result += '/*';
          i++;
          continue;
        } else if (formatted.substring(i, i + 2) === '*/') {
          inComment = false;
          result += '*/\n';
          i++;
          continue;
        }
        
        if (inComment) {
          result += char;
          continue;
        }
        
        if (char === '{') {
          result += ' {\n';
          indentLevel++;
        } else if (char === '}') {
          indentLevel--;
          result += '\t'.repeat(indentLevel) + '}\n';
        } else if (char === ';') {
          result += ';\n';
        } else {
           if (result.endsWith('\n') || result.length === 0) {
            result += '\t'.repeat(indentLevel);
          }
          result += char;
        }
      }
      setError(null);
      return result.trim().replace(/;\s*/g, ';\n'); // Ensure newlines after every semicolon for clarity
    } catch (e) {
      setError('Could not format CSS. Please check for syntax errors.');
      return cssInput;
    }
  }, [cssInput]);

  const syntaxHighlight = (cssString: string | null) => {
    if (!cssString) return null;
    if (error) return <span className="text-destructive">{cssString}</span>;
    
    return cssString
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500 dark:text-gray-400">$1</span>') // comments
      .replace(/(?<!-)([\w-]+)\s*:/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>:') // properties
      .replace(/(:\s*)([^;}\n]+)/g, (match, p1, p2) => { // values
        let valueClass = 'text-green-700 dark:text-green-400'; // Default value color
        if (/^#[\da-fA-F]{3,8}/.test(p2) || /rgb|hsl/.test(p2)) { // color
            valueClass = 'text-purple-600 dark:text-purple-400';
        } else if (/-?\d/.test(p2.trim().split(' ')[0])) { // number
            valueClass = 'text-orange-600 dark:text-orange-400';
        }
        return `${p1}<span class="${valueClass}">${p2}</span>`;
      })
      .replace(/(^|[\n\s])([.#]?[a-zA-Z0-9_:-]+)(?=\s*\{)/g, '$1<span class="text-red-600 dark:text-red-500">$2</span>'); // selectors
  };

  const handleCopy = () => {
    if (!formattedCss || error) {
      toast({
        variant: 'destructive',
        title: 'Cannot copy',
        description: 'There is no valid CSS to copy.',
      });
      return;
    }
    navigator.clipboard.writeText(formattedCss).then(() => {
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setCssInput('');
    setError(null);
  };

  return (
    <div className="mt-8 grid md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Input CSS</h3>
        <Textarea
          value={cssInput}
          onChange={(e) => setCssInput(e.target.value)}
          placeholder="Paste your CSS here..."
          className="h-[60vh] font-mono text-sm resize-none"
        />
      </div>
      <div className="flex flex-col gap-4">
         <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Beautified Output</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!formattedCss || !!error}>
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
                {formattedCss ? (
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(formattedCss) || '' }} />
                ) : (
                  <span className="text-muted-foreground">Your formatted CSS will appear here.</span>
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

export default CssBeautifier;
