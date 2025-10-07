
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
      const indentChar = '  '; // 2 spaces
      let result = '';
      let inString = false;
      let stringChar = '';
      let inComment = false;
      let lineComment = false;
      let inRegex = false;
      
      const trimmedInput = jsInput.replace(/\r\n/g, '\n');

      for (let i = 0; i < trimmedInput.length; i++) {
        const char = trimmedInput[i];
        const prevChar = i > 0 ? trimmedInput[i-1] : null;

        if (lineComment) {
          result += char;
          if (char === '\n') {
            lineComment = false;
            result += indentChar.repeat(indentLevel);
          }
          continue;
        }

        if (inComment) {
          result += char;
          if (char === '*' && trimmedInput[i+1] === '/') {
            inComment = false;
            result += '/';
            i++;
          }
          continue;
        }

        if (inString) {
          result += char;
          if (char === stringChar && prevChar !== '\\') {
            inString = false;
          }
          continue;
        }
        
        if (char === '/' && trimmedInput[i+1] === '*') {
          inComment = true;
          result += '/*';
          i++;
          continue;
        }
        
        if (char === '/' && trimmedInput[i+1] === '/') {
          lineComment = true;
          result += '//';
          i++;
          continue;
        }

        if (char === '{' || char === '[') {
          result += char + '\n' + indentChar.repeat(++indentLevel);
        } else if (char === '}' || char === ']') {
           if (result.trim().length > 0) result += '\n';
          result += indentChar.repeat(--indentLevel) + char;
        } else if (char === ';') {
          result += char + '\n' + indentChar.repeat(indentLevel);
        } else if (char === '\n') {
          if (result.trim().length > 0 && !result.endsWith('\n')) {
             result += '\n' + indentChar.repeat(indentLevel);
          }
        } else if (char === ' ' && (result.endsWith(' ') || result.endsWith('\n'))) {
            // skip extra space
        } else if (char === ':' && !inString) {
          result += ': ';
        }
        else {
          if (result.endsWith('\n')) {
             result += indentChar.repeat(indentLevel);
          }
          result += char;
        }
      }
      
      setError(null);
      // Final cleanup
      return result
        .replace(/(\n\s*){3,}/g, '\n\n') // Collapse multiple empty lines
        .replace(/;\s*\n/g, ';\n') // Ensure newline after semicolon
        .trim();
    } catch (e) {
      setError('Could not format JavaScript. Please check for syntax errors.');
      return jsInput;
    }
  }, [jsInput]);

  const syntaxHighlight = (jsString: string | null) => {
    if (!jsString) return null;
    if (error) return <span className="text-destructive">{jsString}</span>;
    
    const html = jsString
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, '<span class="text-gray-500 dark:text-gray-400">$1</span>')
        .replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|import|from|export|default|async|await|try|catch|finally|class|extends|super|this|of|in|instanceof|typeof|delete|void)\b/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-indigo-600 dark:text-indigo-400">$1</span>')
        .replace(/(['"`])(.*?)\1/gs, (match, quote, content) => `<span class="text-green-700 dark:text-green-400">${quote}${content}${quote}</span>`)
        .replace(/([\w\d_]+)\s*(?=\()/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>')
        .replace(/(\b\d+(\.\d+)?\b)/g, '<span class="text-orange-600 dark:text-orange-400">$1</span>')
        .replace(/([{}[\].;:,=+\-*/%&|!~?<>])/g, '<span class="text-foreground/70">$1</span>');

    return <code dangerouslySetInnerHTML={{ __html: html }} />;
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
                {formattedJs ? syntaxHighlight(formattedJs) :
                  error ? <span className="text-destructive">{error}</span> :
                  <span className="text-muted-foreground">Your formatted JavaScript will appear here.</span>
                }
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
