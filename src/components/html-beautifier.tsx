
'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, ClipboardCheck, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const HtmlBeautifier = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formattedHtml = useMemo(() => {
    if (!htmlInput.trim()) {
      setError(null);
      return '';
    }

    try {
      let indentLevel = 0;
      let result = '';
      const tokens = htmlInput.replace(/>\s+</g, '><').match(/<[^>]+>|[^<]+/g) || [];

      tokens.forEach(token => {
        const trimmedToken = token.trim();
        if (!trimmedToken) return;

        // Decrease indent level for closing tags
        if (trimmedToken.startsWith('</')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        result += '\t'.repeat(indentLevel) + trimmedToken + '\n';
        
        // Increase indent level for opening tags (that are not self-closing)
        if (trimmedToken.startsWith('<') && !trimmedToken.startsWith('</') && !trimmedToken.endsWith('/>')) {
            // A simple check for common void elements that don't increase indent
            const voidElements = ['<area', '<base', '<br', '<col', '<embed', '<hr', '<img', '<input', '<link', '<meta', '<param', '<source', '<track', '<wbr'];
            if (!voidElements.some(tag => trimmedToken.startsWith(tag))) {
                indentLevel++;
            }
        }
      });
      
      setError(null);
      return result.trim();
    } catch (e) {
      setError('Could not format HTML. Please check for syntax errors.');
      return htmlInput;
    }
  }, [htmlInput]);

  const syntaxHighlight = (htmlString: string | null) => {
    if (!htmlString) return null;
    if (error) return <span className="text-destructive">{htmlString}</span>;
    
    return htmlString
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[\w\s="/.':<>-]+&gt;)/g, (match) => {
          let highlighted = match.replace(/([\w-]+)=/g, '<span class="text-purple-500 dark:text-purple-400">$1</span>=');
          highlighted = highlighted.replace(/(".*?")/g, '<span class="text-green-600 dark:text-green-400">$1</span>');
          highlighted = highlighted.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="text-red-500 dark:text-red-400">$2</span>');
          return highlighted;
      });
  };

  const handleCopy = () => {
    if (!formattedHtml || error) {
      toast({
        variant: 'destructive',
        title: 'Cannot copy',
        description: 'There is no valid HTML to copy.',
      });
      return;
    }
    navigator.clipboard.writeText(formattedHtml).then(() => {
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setHtmlInput('');
    setError(null);
  };

  return (
    <div className="mt-8 grid md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Input HTML</h3>
        <Textarea
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
          placeholder="Paste your HTML here..."
          className="h-[60vh] font-mono text-sm resize-none"
        />
      </div>
      <div className="flex flex-col gap-4">
         <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Beautified Output</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!formattedHtml || !!error}>
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
                {formattedHtml ? (
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(formattedHtml) || '' }} />
                ) : (
                  <span className="text-muted-foreground">Your formatted HTML will appear here.</span>
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

export default HtmlBeautifier;
