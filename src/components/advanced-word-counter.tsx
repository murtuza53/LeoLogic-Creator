
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clipboard, ClipboardCheck, Trash2, BarChart, LoaderCircle, Sparkles } from 'lucide-react';
import { Progress } from './ui/progress';
import { analyzeTextAction } from '@/app/actions';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

type TextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTime: number; // in minutes
};

type AnalysisResult = {
  clarityScore: number;
  clarityFeedback: string;
  tone: string;
  toneFeedback: string;
  overallImpression: string;
  suggestions: string[];
};

const StatCard = ({ title, value, unit }: { title: string; value: string | number, unit?: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg text-center">
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-xs text-muted-foreground">{unit ? `${title} (${unit})` : title}</div>
  </div>
);

export default function AdvancedWordCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const { toast } = useToast();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('advancedWordCounter');

  const stats: TextStats = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.match(/[\w|)][.?!]+(\s|$)/g)?.length || 0;
    const paragraphs = text.split(/\n+/).filter(p => p.trim() !== '').length;
    const readingTime = Math.ceil(words / 200); // Average reading speed
    return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
  }, [text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: 'Text copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setText('');
    setShowAnalysis(false);
    setAnalysisResult(null);
  };
  
  const handleAnalyze = async () => {
      if (!text.trim()) {
          toast({ variant: 'destructive', title: 'No text to analyze' });
          return;
      }
      if (isUserLoading) return toast({ description: "Verifying user..." });
      if (!checkLimit()) return;
      incrementUsage();

      setIsLoadingAnalysis(true);
      setAnalysisResult(null);
      try {
          const result = await analyzeTextAction(text);
          if (result.error) throw new Error(result.error);
          setAnalysisResult(result as AnalysisResult);
          setShowAnalysis(true);
      } catch (e) {
          toast({ variant: 'destructive', title: 'Analysis Failed', description: "Could not analyze the text." });
      } finally {
          setIsLoadingAnalysis(false);
      }
  }

  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here..."
            className="h-64 text-base resize-y"
          />
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-4">
            <StatCard title="Words" value={stats.words} />
            <StatCard title="Characters" value={stats.characters} />
            <StatCard title="Chars (no spaces)" value={stats.charactersNoSpaces} />
            <StatCard title="Sentences" value={stats.sentences} />
            <StatCard title="Paragraphs" value={stats.paragraphs} />
            <StatCard title="Reading Time" value={stats.readingTime} unit="min" />
          </div>
          <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
            <Button onClick={handleAnalyze} disabled={isLoadingAnalysis}>
              {isLoadingAnalysis ? (
                <> <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Analyzing... </>
              ) : (
                <> <BarChart className="mr-2 h-4 w-4" /> Show Detailed Analysis </>
              )}
            </Button>
            <div className='flex gap-2'>
              <Button variant="outline" onClick={handleCopy} disabled={!text}>
                {copied ? <ClipboardCheck className="mr-2" /> : <Clipboard className="mr-2" />}
                Copy Text
              </Button>
              <Button onClick={handleClear} disabled={!text}>
                <Trash2 className="mr-2" />
                Clear Text
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showAnalysis && analysisResult && (
        <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Sparkles className='text-accent'/> AI Writing Analysis</CardTitle>
                <CardDescription>{analysisResult.overallImpression}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='grid md:grid-cols-2 gap-6'>
                    <div>
                        <h3 className="font-semibold">Clarity Score: {analysisResult.clarityScore}/10</h3>
                        <Progress value={analysisResult.clarityScore * 10} className="mt-2" />
                        <p className='mt-2 text-sm text-muted-foreground'>{analysisResult.clarityFeedback}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold">Tone: <span className='text-primary'>{analysisResult.tone}</span></h3>
                        <p className='mt-2 text-sm text-muted-foreground'>{analysisResult.toneFeedback}</p>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold">Suggestions for Improvement</h3>
                    <ul className='mt-2 list-disc list-inside space-y-2 text-sm'>
                        {analysisResult.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
