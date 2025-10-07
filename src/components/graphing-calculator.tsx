
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Lightbulb } from 'lucide-react';

// Basic math expression parser. Supports +, -, *, /, ^, sin, cos, tan
const evaluateExpression = (expression: string, x: number): number => {
    try {
        const sanitizedExpression = expression
            .replace(/\s+/g, '') // Remove all whitespace
            .replace(/\^/g, '**')
            .replace(/(\d+)(x|sin|cos|tan|sqrt|log|ln|pi|e)/g, '$1*$2') // Add multiplication for implicit cases like 2x or 2sin(x)
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/pi/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/x/g, `(${x})`); // Wrap x in parentheses to handle negative numbers

        // Use a Function constructor for safer evaluation than eval()
        return new Function('return ' + sanitizedExpression)();
    } catch (e) {
        return NaN; // Return NaN on parsing error
    }
}

export default function GraphingCalculator() {
    const { toast } = useToast();
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('graphingCalculator');
    const [expression, setExpression] = useState('x^2');
    const [inputExpression, setInputExpression] = useState('x^2');
    const [error, setError] = useState<string | null>(null);

    const data = useMemo(() => {
        if (!expression) return [];
        const points = [];
        for (let i = -10; i <= 10; i += 0.5) {
            const y = evaluateExpression(expression, i);
            if (!isNaN(y) && isFinite(y)) {
                points.push({ x: i, y });
            }
        }
        return points;
    }, [expression]);

    const handlePlot = useCallback(() => {
        if (isUserLoading) {
            toast({ description: "Verifying user status..." });
            return;
        }
        if (!checkLimit()) return;
        incrementUsage();
        
        setError(null);
        // Test with a sample point to see if the expression is valid
        const testY = evaluateExpression(inputExpression, 1);
        if (isNaN(testY)) {
            setError("Invalid function. Please check your expression.");
            toast({
                variant: 'destructive',
                title: 'Invalid Expression',
                description: "Could not plot the function. Please check your syntax."
            })
        } else {
            setExpression(inputExpression);
        }
    }, [inputExpression, isUserLoading, checkLimit, incrementUsage, toast]);

    return (
        <div className="mt-8 space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Enter Function</CardTitle>
                    <CardDescription>Enter a function of 'x' to plot it on the graph below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="e.g., x^2, sin(x), 2*x + 1"
                            value={inputExpression}
                            onChange={(e) => setInputExpression(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePlot()}
                        />
                        <Button onClick={handlePlot}>Plot Function</Button>
                    </div>
                     {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardContent className="p-2 sm:p-6 h-[50vh]">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="x" 
                                type="number" 
                                domain={[-10, 10]} 
                                ticks={[-10, -5, 0, 5, 10]}
                                label={{ value: 'x', position: 'insideBottomRight', offset: 0 }}
                            />
                            <YAxis 
                                allowDataOverflow={true}
                                domain={['auto', 'auto']}
                                label={{ value: 'y', position: 'insideTopLeft', offset: -5 }}
                            />
                            <Tooltip 
                                formatter={(value: number) => value.toFixed(2)}
                                labelFormatter={(label: number) => `x: ${label}`}
                            />
                            <Legend />
                             <Line 
                                type="monotone" 
                                dataKey="y" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2} 
                                dot={false} 
                                name={expression}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Supported Functions & Operators</AlertTitle>
                <AlertDescription>
                    You can use: `+`, `-`, `*`, `/`, `^` (for power), `sin()`, `cos()`, `tan()`, `sqrt()`, `log()` (base 10), `ln()` (natural log), `pi`, and `e`.
                </AlertDescription>
            </Alert>
        </div>
    );
}
