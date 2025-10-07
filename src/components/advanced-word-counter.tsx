
"use client";

import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clipboard, ClipboardCheck, Trash2, BarChart, Clock, CaseSensitive, Hash, SortAsc, Pilcrow, BookOpen, Mic, BrainCircuit } from 'lucide-react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

type DetailedStats = {
  // Time Metrics
  readingTime: number; // in seconds
  speakingTime: number; // in seconds
  readingLevel: string;

  // Character Breakdown
  spaces: number;
  lowercase: number;
  uppercase: number;
  numbers: number;
  specialChars: number;

  // Word Analysis
  words: number;
  sentences: number;
  paragraphs: number;
  averageWordLength: number;
  longestWord: string;
  uniqueWords: number;

  // Keyword Density
  keywordDensity: { word: string; count: number; percentage: number }[];
};


const StatCard = ({ title, value, unit }: { title: string; value: string | number, unit?: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg text-center h-full">
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-xs text-muted-foreground">{unit ? `${title} (${unit})` : title}</div>
  </div>
);

const getReadingLevel = (words: number, sentences: number, complexWords: number): string => {
    if (words === 0 || sentences === 0) return 'N/A';
    const fleschReadingEase = 206.835 - 1.015 * (words / sentences) - 84.6 * (complexWords / words);
    
    if (fleschReadingEase > 90) return 'Very Easy (5th Grade)';
    if (fleschReadingEase > 80) return 'Easy (6th Grade)';
    if (fleschReadingEase > 70) return 'Fairly Easy (7th Grade)';
    if (fleschReadingEase > 60) return 'Standard (8th & 9th Grade)';
    if (fleschReadingEase > 50) return 'Fairly Difficult (10th to 12th Grade)';
    if (fleschReadingEase > 30) return 'Difficult (College)';
    return 'Very Difficult (Graduate)';
}

export default function AdvancedWordCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { toast } = useToast();

  const stats: DetailedStats = useMemo(() => {
    const trimmedText = text.trim();
    const wordsArray = trimmedText.split(/\s+/).filter(Boolean);
    const words = wordsArray.length;
    const characters = text.length;
    
    const spaces = text.split(' ').length - 1;
    const lowercase = (text.match(/[a-z]/g) || []).length;
    const uppercase = (text.match(/[A-Z]/g) || []).length;
    const numbers = (text.match(/[0-9]/g) || []).length;
    const specialChars = characters - (lowercase + uppercase + numbers + spaces);
    
    const sentences = (text.match(/[\w|)][.?!]+(\s|$)/g) || (words > 0 ? 1 : 0));
    const paragraphs = text.split(/\n+/).filter(p => p.trim() !== '').length;
    
    const readingTime = Math.round((words / 200) * 60) ; // at 200 WPM
    const speakingTime = Math.round((words / 150) * 60) ; // at 150 WPM

    const totalWordLength = wordsArray.reduce((acc, word) => acc + word.length, 0);
    const averageWordLength = words > 0 ? parseFloat((totalWordLength / words).toFixed(1)) : 0;
    
    const longestWord = wordsArray.reduce((longest, current) => current.length > longest.length ? current : longest, "");
    
    const uniqueWordsSet = new Set(wordsArray.map(word => word.toLowerCase().replace(/[^a-z]/g, '')));
    const uniqueWords = uniqueWordsSet.size;

    const wordFrequencies = wordsArray.reduce((acc, word) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord) {
            acc[cleanWord] = (acc[cleanWord] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const keywordDensity = Object.entries(wordFrequencies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({
            word,
            count,
            percentage: parseFloat(((count / words) * 100).toFixed(2)) || 0,
        }));
    
    const isVowel = (char: string) => "aeiouy".includes(char.toLowerCase());
    const countSyllables = (word: string) => {
        word = word.toLowerCase();
        if(word.length <= 3) return 1;
        let count = word.match(/[aeiouy]+/g)?.length || 0;
        if(word.endsWith("e") && !word.endsWith("le") && count > 1) {
            count--;
        }
        return count > 0 ? count : 1;
    }
    const complexWords = wordsArray.filter(word => countSyllables(word) >= 3).length;
    const readingLevel = getReadingLevel(words, sentences, complexWords);

    return { 
        words, 
        characters,
        spaces,
        lowercase,
        uppercase,
        numbers,
        specialChars,
        sentences, 
        paragraphs, 
        readingTime,
        speakingTime,
        readingLevel,
        averageWordLength,
        longestWord,
        uniqueWords,
        keywordDensity,
    };
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
  };
  
  const handleAnalyze = () => {
      if (!text.trim()) {
          toast({ variant: 'destructive', title: 'No text to analyze' });
          return;
      }
      setShowAnalysis(true);
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
          <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
            <Button onClick={handleAnalyze}>
                <BarChart className="mr-2 h-4 w-4" /> Show Detailed Analysis
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
      
      {showAnalysis && (
        <Card className="shadow-lg animate-in fade-in-50">
            <CardContent className='p-6 space-y-8'>
                <section>
                    <CardTitle className='flex items-center gap-2 mb-4'><Clock className='text-accent'/> Time Metrics</CardTitle>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                        <StatCard title="Reading Time" value={stats.readingTime} unit="sec" />
                        <StatCard title="Speaking Time" value={stats.speakingTime} unit="sec" />
                        <StatCard title="Reading Level" value={stats.readingLevel.split(' ')[0]} unit={stats.readingLevel.split(' ').slice(1).join(' ')} />
                    </div>
                </section>
                <section>
                    <CardTitle className='flex items-center gap-2 mb-4'><CaseSensitive className='text-accent'/> Character Breakdown</CardTitle>
                    <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                        <StatCard title="Characters" value={stats.characters} />
                        <StatCard title="Spaces" value={stats.spaces} />
                        <StatCard title="Lowercase" value={stats.lowercase} />
                        <StatCard title="Uppercase" value={stats.uppercase} />
                        <StatCard title="Numbers" value={stats.numbers} />
                        <StatCard title="Special Chars" value={stats.specialChars} />
                        <StatCard title="Words" value={stats.words} />
                        <StatCard title="Sentences" value={stats.sentences} />
                        <StatCard title="Paragraphs" value={stats.paragraphs} />
                    </div>
                </section>
                 <section>
                    <CardTitle className='flex items-center gap-2 mb-4'><SortAsc className='text-accent'/> Word Analysis</CardTitle>
                     <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                        <StatCard title="Average Word Length" value={stats.averageWordLength} />
                        <StatCard title="Longest Word" value={stats.longestWord || 'N/A'} />
                        <StatCard title="Unique Words" value={stats.uniqueWords} />
                    </div>
                </section>
                 <section>
                    <CardTitle className='flex items-center gap-2 mb-4'><Pilcrow className='text-accent'/> Top Keywords (Keyword Density)</CardTitle>
                     <div className='space-y-4'>
                        {stats.keywordDensity.length > 0 ? stats.keywordDensity.map((kw, index) => (
                           <div key={index} className="flex items-center gap-4">
                               <Badge variant="secondary" className="text-lg">{index + 1}</Badge>
                               <div className='flex-1'>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-base font-medium">{kw.word}</span>
                                        <span className="text-sm font-medium">{kw.count}x - {kw.percentage}%</span>
                                    </div>
                                    <Progress value={kw.percentage} className="h-3" />
                               </div>
                           </div>
                        )) : <p className="text-muted-foreground text-center">No keywords to display yet.</p>}
                    </div>
                </section>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
