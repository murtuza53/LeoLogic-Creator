
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Lightbulb, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';

// Basic math expression parser. Supports +, -, *, /, ^, sin, cos, tan
const evaluateExpression = (expression: string, x: number): number => {
    try {
        const sanitizedExpression = expression
            .replace(/\s+/g, '') // Remove all whitespace
            .replace(/\^/g, '**')
            .replace(/(\d+(\.\d+)?)(x|sin|cos|tan|sqrt|log|ln|pi|e|\()/g, '$1*$3')
            .replace(/(\))(\w|\()/g, '$1*$2')
            .replace(/x\(/g, 'x*(')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/pi/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/x/g, `(${x})`);

        return new Function('return ' + sanitizedExpression)();
    } catch (e) {
        return NaN;
    }
}

const lineColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

type Equation = {
  id: number;
  value: string;
  color: string;
};

type Domain = [number, number];

export default function GraphingCalculator() {
    const { toast } = useToast();
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('graphingCalculator');
    const { user } = useUser();
    
    const [equations, setEquations] = useState<Equation[]>([{ id: 1, value: 'x^2', color: lineColors[0] }]);
    const [plottedEquations, setPlottedEquations] = useState<Equation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [yDomain, setYDomain] = useState<Domain>([-10, 10]);

    useEffect(() => {
        if(plottedEquations.length === 0){
             setPlottedEquations([{ id: 1, value: 'x^2', color: lineColors[0] }]);
        }
    }, [])

    const data = useMemo(() => {
        if (plottedEquations.length === 0) return [];
        const points = [];
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = -10; i <= 10; i += 0.25) {
            const point: { [key: string]: number } = { x: i };
            let hasValidY = false;
            plottedEquations.forEach(eq => {
                const y = evaluateExpression(eq.value, i);
                if (!isNaN(y) && isFinite(y)) {
                    point[`y${eq.id}`] = y;
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                    hasValidY = true;
                }
            });
            if(hasValidY) {
                points.push(point);
            }
        }
        
        if (isFinite(minY) && isFinite(maxY)) {
            const padding = Math.abs(maxY - minY) * 0.1 || 1;
            setYDomain([Math.floor(minY - padding), Math.ceil(maxY + padding)]);
        } else {
            setYDomain([-10, 10]);
        }
        
        return points;
    }, [plottedEquations]);

    const handlePlot = useCallback(() => {
        if (isUserLoading) {
            toast({ description: "Verifying user status..." });
            return;
        }
        if (!checkLimit()) return;
        incrementUsage();
        
        setError(null);
        let isValid = true;
        equations.forEach(eq => {
            // A simple check to see if the equation is empty
            if(!eq.value.trim()){
                setError(`Equation cannot be empty.`);
                toast({ variant: 'destructive', title: 'Empty Equation', description: 'Please enter a function to plot.'});
                isValid = false;
                return;
            }
            const testY = evaluateExpression(eq.value, 1);
            if (isNaN(testY)) {
                setError(`Invalid function in equation: "${eq.value}". Please check your expression.`);
                toast({
                    variant: 'destructive',
                    title: 'Invalid Expression',
                    description: `Could not plot function: "${eq.value}". Please check your syntax.`
                });
                isValid = false;
            }
        });
        
        if (isValid) {
            setPlottedEquations([...equations]);
        }
    }, [equations, isUserLoading, checkLimit, incrementUsage, toast]);

    const handleEquationChange = (id: number, value: string) => {
        setEquations(equations.map(eq => eq.id === id ? { ...eq, value } : eq));
    };

    const addEquation = () => {
        if (!user) {
             toast({
                title: "Feature Locked",
                description: "Sign up for a free account to plot multiple functions.",
                action: <Button asChild><Link href="/signup">Sign Up</Link></Button>
            });
            return;
        }
        if (equations.length >= lineColors.length) {
            toast({
                variant: 'destructive',
                title: 'Maximum functions reached',
                description: `You can plot up to ${lineColors.length} functions.`
            });
            return;
        }
        const newId = (equations[equations.length - 1]?.id || 0) + 1;
        setEquations([...equations, { id: newId, value: '', color: lineColors[equations.length % lineColors.length] }]);
    };

    const removeEquation = (id: number) => {
        if (equations.length === 1) return;
        setEquations(equations.filter(eq => eq.id !== id));
    };


    return (
        <div className="mt-8 space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Enter Functions</CardTitle>
                    <CardDescription>Enter one or more functions of 'x' to plot on the graph.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className='space-y-3'>
                        {equations.map((eq, index) => (
                            <div key={eq.id} className="flex gap-2 items-center">
                                <div className='w-2 h-8 rounded-full' style={{backgroundColor: eq.color}} />
                                <Input
                                    placeholder={`e.g., x^2, sin(x), 2*x + 1`}
                                    value={eq.value}
                                    onChange={(e) => handleEquationChange(eq.id, e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePlot()}
                                />
                                {equations.length > 1 && (
                                     <Button variant="ghost" size="icon" onClick={() => removeEquation(eq.id)}>
                                        <Trash2 className="text-destructive h-4 w-4" />
                                     </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className='flex justify-between items-center'>
                         <div>
                            <Button variant="outline" onClick={addEquation} disabled={equations.length >= lineColors.length}>
                                <PlusCircle className="mr-2" /> Add another function
                            </Button>
                            {!user && <p className='text-xs text-muted-foreground mt-1'><Link href="/signup" className='underline text-primary'>Sign up</Link> to add more functions.</p>}
                         </div>
                        <Button onClick={handlePlot}>Plot Functions</Button>
                    </div>
                     {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardContent className="p-2 sm:p-6 h-[70vh]">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 0, 0, 0.2)" />
                            <XAxis 
                                dataKey="x" 
                                type="number" 
                                domain={[-10, 10]} 
                                ticks={[-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10]}
                                label={{ value: 'x', position: 'insideBottomRight', offset: -10 }}
                            />
                            <YAxis 
                                domain={yDomain}
                                tickCount={11}
                                label={{ value: 'y', position: 'insideTopLeft', offset: -5 }}
                            />
                            <Tooltip 
                                formatter={(value: number, name: string) => [value.toFixed(2), plottedEquations.find(eq => `y${eq.id}` === name)?.value]}
                                labelFormatter={(label: number) => `x: ${label.toFixed(2)}`}
                            />
                            <Legend />
                            <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeWidth={1.5} />
                            <ReferenceLine x={0} stroke="hsl(var(--destructive))" strokeWidth={1.5} />
                            {plottedEquations.map(eq => (
                                <Line 
                                    key={eq.id}
                                    type="monotone" 
                                    dataKey={`y${eq.id}`}
                                    stroke={eq.color}
                                    strokeWidth={2} 
                                    dot={false} 
                                    name={eq.value}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Supported Functions & Operators</AlertTitle>
                <AlertDescription>
                    You can use: `+`, `-`, `*`, `/`, `^` (for power), `sin()`, `cos()`, `tan()`, `sqrt()`, `log()` (base 10), `ln()` (natural log), `pi`, and `e`. Implicit multiplication like `2x` is also supported.
                </AlertDescription>
            </Alert>
        </div>
    );
}
