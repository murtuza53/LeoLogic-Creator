
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
      let inComment = false; // 'single' or 'multi'
      let inRegex = false;

      for (let i = 0; i < jsInput.length; i++) {
        const char = jsInput[i];
        const prevChar = i > 0 ? jsInput[i - 1] : '';
        const nextChar = i < jsInput.length - 1 ? jsInput[i + 1] : '';
        const currentLine = result.substring(result.lastIndexOf('\n') + 1);

        if (inString) {
          result += char;
          if (char === stringChar && prevChar !== '\\') {
            inString = false;
          }
          continue;
        }

        if (inComment) {
          result += char;
          if (
            (inComment === 'single' && char === '\n') ||
            (inComment === 'multi' && char === '/' && prevChar === '*')
          ) {
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
        
        const operatorChars = '(){}[]+-*/%=&|<>!~^,;?';
        if (char === '/' && !operatorChars.includes(jsInput.substring(i - 1, i).trim())) {
            inRegex = true;
            result += char;
            continue;
        }

        if (char === '{' || char === '[') {
          result += char + '\n' + '\t'.repeat(++indentLevel);
        } else if (char === '}' || char === ']') {
          result = result.trimEnd() + '\n' + '\t'.repeat(--indentLevel) + char;
        } else if (char === ';') {
          result += char + '\n' + '\t'.repeat(indentLevel);
        } else if (char === '\n') {
           if (result.trim().length > 0 && !result.endsWith('\n')) {
              result += '\n' + '\t'.repeat(indentLevel);
           }
        } else {
            if (currentLine.trim() === '' && char.trim() !== '') {
                result += '\t'.repeat(indentLevel);
            }
            result += char;
        }
      }

      setError(null);
      return result
        .replace(/\n\s*\n/g, '\n') // remove multiple blank lines
        .replace(/(\t*)\}\n\s*(else|catch|finally)/g, '$1} $2') // put else on same line as }
        .trim();
    } catch (e) {
      setError('Could not format JavaScript. Please check for syntax errors.');
      return jsInput;
    }
  }, [jsInput]);

  const syntaxHighlight = (jsString: string | null) => {
    if (!jsString) return null;
    if (error) return <span className="text-destructive">{jsString}</span>;

    return jsString
      .replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/g, '<span class="text-gray-500 dark:text-gray-400">$1</span>') // comments
      .replace(/('.*?'|".*?"|`.*?`)/g, '<span class="text-green-600 dark:text-green-400">$1</span>') // strings
      .replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|new|this|import|from|export|default|async|await|try|catch|finally)\b/g, '<span class="text-purple-600 dark:text-purple-400 font-medium">$1</span>') // keywords
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-blue-500 dark:text-blue-400">$1</span>') // booleans and null
      .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="text-teal-600 dark:text-teal-400">$1</span>') // Class names
      .replace(/(\d+)/g, '<span class="text-orange-600 dark:text-orange-400">$1</span>') // numbers
      .replace(/([a-zA-Z0-9_]+)(?=\()/g, '<span class="text-yellow-600 dark:text-yellow-500">$1</span>') // function calls
      .replace(/(\(|\)|\{|\}|\[|\])/g, '<span class="text-foreground/80">$1</span>'); // brackets
  };

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
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(formattedJs) || '' }} />
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

    