
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

export default function ScientificCalculator() {
  const [input, setInput] = useState('0');
  const [previousInput, setPreviousInput] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [isDeg, setIsDeg] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('scientificCalculator');

  const handleFirstUse = useCallback(() => {
    if (!checkLimit()) return;
    incrementUsage();
  }, [checkLimit, incrementUsage]);

  useEffect(() => {
    const onFirstUse = () => {
      if (isUserLoading) return;
      handleFirstUse();
    };
    window.addEventListener('click', onFirstUse, { once: true });
    return () => window.removeEventListener('click', onFirstUse);
  }, [isUserLoading, handleFirstUse]);

  const handleNumber = (value: string) => {
    if (!checkLimit()) return;
    incrementUsage();
    if (input === '0' || input === 'Error') {
      setInput(value);
    } else {
      setInput(prev => prev + value);
    }
  };

  const handleDecimal = () => {
    if (!checkLimit()) return;
    incrementUsage();
    if (!input.includes('.')) {
      setInput(prev => prev + '.');
    }
  };

  const handleOperator = (op: string) => {
    if (!checkLimit()) return;
    incrementUsage();
    if (previousInput && operator && input !== 'Error') {
      handleEquals();
      setOperator(op);
    } else {
      setPreviousInput(input);
      setInput('0');
      setOperator(op);
    }
  };

  const handleEquals = () => {
    if (!checkLimit()) return;
    incrementUsage();
    if (!operator || previousInput === null) return;
    const prev = parseFloat(previousInput);
    const current = parseFloat(input);
    let result: number;
    switch (operator) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '×': result = prev * current; break;
      case '÷':
        if (current === 0) {
          setInput('Error');
          return;
        }
        result = prev / current;
        break;
      case 'x^y': result = Math.pow(prev, current); break;
      default: return;
    }
    setInput(result.toString());
    setPreviousInput(null);
    setOperator(null);
  };

  const handleClear = () => {
    if (!checkLimit()) return;
    incrementUsage();
    setInput('0');
    setPreviousInput(null);
    setOperator(null);
  };

  const handleFunction = (func: string) => {
    if (!checkLimit()) return;
    incrementUsage();
    const num = parseFloat(input);
    let result: number;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;

    try {
        switch (func) {
        case 'sin': result = isDeg ? Math.sin(toRad(num)) : Math.sin(num); break;
        case 'cos': result = isDeg ? Math.cos(toRad(num)) : Math.cos(num); break;
        case 'tan': result = isDeg ? Math.tan(toRad(num)) : Math.tan(num); break;
        case 'ln': result = Math.log(num); break;
        case 'log': result = Math.log10(num); break;
        case '√': result = Math.sqrt(num); break;
        case 'x²': result = Math.pow(num, 2); break;
        case '±': result = num * -1; break;
        case '%': result = num / 100; break;
        case 'π': setInput(Math.PI.toString()); return;
        case 'e': setInput(Math.E.toString()); return;
        case '1/x': result = 1 / num; break;
        default: return;
        }
        if (isNaN(result) || !isFinite(result)) throw new Error("Invalid operation");
        setInput(result.toString());
    } catch {
        setInput("Error");
    }
  };

  const buttons = [
    { label: 'Rad', func: () => setIsDeg(false), type: 'function', style: isDeg ? 'ghost' : 'secondary'},
    { label: 'Deg', func: () => setIsDeg(true), type: 'function', style: !isDeg ? 'ghost' : 'secondary'},
    { label: 'x²', func: () => handleFunction('x²'), type: 'function' },
    { label: 'x^y', func: () => handleOperator('x^y'), type: 'function' },
    { label: 'sin', func: () => handleFunction('sin'), type: 'function' },
    { label: 'cos', func: () => handleFunction('cos'), type: 'function' },
    { label: 'tan', func: () => handleFunction('tan'), type: 'function' },
    { label: '√', func: () => handleFunction('√'), type: 'function' },
    { label: 'C', func: handleClear, type: 'clear' },
    { label: 'ln', func: () => handleFunction('ln'), type: 'function' },
    { label: 'log', func: () => handleFunction('log'), type: 'function' },
    { label: '÷', func: () => handleOperator('÷'), type: 'operator' },
    { label: 'π', func: () => handleFunction('π'), type: 'function' },
    { label: '7', func: () => handleNumber('7'), type: 'number' },
    { label: '8', func: () => handleNumber('8'), type: 'number' },
    { label: '9', func: () => handleNumber('9'), type: 'number' },
    { label: '×', func: () => handleOperator('×'), type: 'operator' },
    { label: 'e', func: () => handleFunction('e'), type: 'function' },
    { label: '4', func: () => handleNumber('4'), type: 'number' },
    { label: '5', func: () => handleNumber('5'), type: 'number' },
    { label: '6', func: () => handleNumber('6'), type: 'number' },
    { label: '-', func: () => handleOperator('-'), type: 'operator' },
    { label: '1/x', func: () => handleFunction('1/x'), type: 'function' },
    { label: '1', func: () => handleNumber('1'), type: 'number' },
    { label: '2', func: () => handleNumber('2'), type: 'number' },
    { label: '3', func: () => handleNumber('3'), type: 'number' },
    { label: '+', func: () => handleOperator('+'), type: 'operator' },
    { label: '±', func: () => handleFunction('±'), type: 'function' },
    { label: '0', func: () => handleNumber('0'), type: 'number' },
    { label: '.', func: handleDecimal, type: 'number' },
    { label: '%', func: () => handleFunction('%'), type: 'function' },
    { label: '=', func: handleEquals, type: 'equals' },
  ];

  return (
    <Card className="p-4 shadow-lg bg-background/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="mb-4 text-right bg-muted/30 p-4 rounded-lg">
           <div className="text-sm text-muted-foreground h-6">
            {previousInput} {operator}
          </div>
          <div className="text-4xl font-mono break-all">{input}</div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {buttons.map((btn, i) => (
            <Button
              key={i}
              onClick={btn.func}
              variant={btn.style as any || (btn.type === 'operator' || btn.type === 'equals' ? 'default' : 'secondary')}
              className={`text-lg font-bold h-14 ${btn.label === '=' ? 'bg-accent hover:bg-accent/90' : ''}`}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

    