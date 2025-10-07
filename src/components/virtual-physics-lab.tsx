
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MoveUp, MoveRight, Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const GRAVITY = 9.81; // m/s^2

export const ComingSoon = ({ experimentName }: { experimentName: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg bg-muted/50 mt-8">
      <h3 className="text-2xl font-semibold mb-2">{experimentName} Simulation</h3>
      <p className="text-muted-foreground">This feature is coming soon. Stay tuned!</p>
    </div>
);


export const ProjectileMotion = () => {
    const [initialVelocity, setInitialVelocity] = useState(25);
    const [angle, setAngle] = useState(45);
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('projectileMotion');
    
    useEffect(() => {
      if (isUserLoading) return;
      if (!checkLimit()) return;
      incrementUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUserLoading]);

    const timeOfFlight = useMemo(() => (2 * initialVelocity * Math.sin(angle * Math.PI / 180)) / GRAVITY, [initialVelocity, angle]);
    const maxRange = useMemo(() => (initialVelocity * initialVelocity * Math.sin(2 * angle * Math.PI / 180)) / GRAVITY, [initialVelocity, angle]);
    const maxHeight = useMemo(() => Math.pow(initialVelocity * Math.sin(angle * Math.PI / 180), 2) / (2 * GRAVITY), [initialVelocity, angle]);

    const fullPath = useMemo(() => {
        const points = [];
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
             const t = (timeOfFlight / steps) * i;
             const x = initialVelocity * Math.cos(angle * Math.PI / 180) * t;
             const y = initialVelocity * Math.sin(angle * Math.PI / 180) * t - 0.5 * GRAVITY * t * t;
             points.push({x, y});
        }
        return points;
    }, [initialVelocity, angle, timeOfFlight]);

    const domainX = [0, Math.max(10, Math.ceil(maxRange / 10) * 10 + 10)];
    const domainY = [0, Math.max(10, Math.ceil(maxHeight / 5) * 5 + 5)];


    const StatCard = ({ icon, label, value, unit }: { icon: React.ElementType, label: string, value: string, unit: string }) => (
        <Card className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
                {React.createElement(icon, {className: "h-6 w-6 text-muted-foreground"})}
                <CardTitle className="text-lg">{label}</CardTitle>
            </div>
            <p className="text-3xl font-bold text-primary mt-2">{value}</p>
            <p className="text-sm text-muted-foreground">{unit}</p>
        </Card>
    );

    return (
        <div className="mt-8 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Controls</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="velocity">Initial Velocity ({initialVelocity.toFixed(1)} m/s)</Label>
                        <Slider id="velocity" min={1} max={50} step={0.5} value={[initialVelocity]} onValueChange={(v) => setInitialVelocity(v[0])} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="angle">Launch Angle ({angle.toFixed(1)}°)</Label>
                        <Slider id="angle" min={0} max={90} step={0.5} value={[angle]} onValueChange={(v) => setAngle(v[0])} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gravity">Gravity</Label>
                        <Input id="gravity" value={`${GRAVITY} m/s²`} disabled />
                    </div>
                </CardContent>
            </Card>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard icon={MoveRight} label="Max Distance" value={maxRange.toFixed(2)} unit="meters" />
                <StatCard icon={MoveUp} label="Peak Height" value={maxHeight.toFixed(2)} unit="meters" />
            </div>

            <Card className="h-[60vh]">
                <CardContent className="p-2 sm:p-6 h-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                            data={fullPath}
                            margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                type="number" 
                                dataKey="x" 
                                name="Distance" 
                                unit="m" 
                                domain={domainX} 
                                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -15 }}
                                allowDataOverflow={true}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="y" 
                                name="Height" 
                                unit="m" 
                                domain={domainY}
                                label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', offset: 10 }}
                                allowDataOverflow={true}
                            />
                            <Tooltip formatter={(value: number) => value.toFixed(2)} />
                            <Line 
                                type="monotone" 
                                dataKey="y" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={3} 
                                dot={false}
                                name="Trajectory"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

export const PendulumDynamics = () => {
    const [length, setLength] = useState(1.5); // meters
    const [mass, setMass] = useState(1); // kg
    const [initialAngle, setInitialAngle] = useState(30); // degrees
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [positionHistory, setPositionHistory] = useState<{time: number, x: number}[]>([]);

    const animationFrameId = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('pendulumDynamics');
    
    useEffect(() => {
      if (isUserLoading) return;
      if (!checkLimit()) return;
      incrementUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUserLoading]);

    const period = useMemo(() => 2 * Math.PI * Math.sqrt(length / GRAVITY), [length]);
    const angularFrequency = useMemo(() => Math.sqrt(GRAVITY / length), [length]);
    const maxSpeed = useMemo(() => Math.sqrt(2 * GRAVITY * length * (1 - Math.cos(initialAngle * Math.PI / 180))), [length, initialAngle]);
    const maxDisplacement = useMemo(() => length * Math.sin(initialAngle * Math.PI / 180), [length, initialAngle]);

    const animate = useCallback((timestamp: number) => {
        if (lastTimeRef.current !== null) {
            const deltaTime = (timestamp - lastTimeRef.current) / 1000;
            setTime(prevTime => {
                const newTime = prevTime + deltaTime;
                const currentAngleRad = (initialAngle * Math.PI / 180) * Math.cos(angularFrequency * newTime);
                const bobX = length * Math.sin(currentAngleRad);
                setPositionHistory(prevHistory => [...prevHistory, { time: newTime, x: bobX }]);
                return newTime;
            });
        }
        lastTimeRef.current = timestamp;
        animationFrameId.current = requestAnimationFrame(animate);
    }, [angularFrequency, initialAngle, length]);
    
    useEffect(() => {
        if (isRunning) {
            lastTimeRef.current = performance.now();
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            lastTimeRef.current = null;
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isRunning, animate]);

    const currentAngleRad = (initialAngle * Math.PI / 180) * Math.cos(angularFrequency * time);
    const bobX = length * Math.sin(currentAngleRad);
    const bobY = length * Math.cos(currentAngleRad);

    const StatCard = ({ icon, label, value, unit }: { icon: React.ElementType, label: string, value: string, unit: string }) => (
        <Card className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
                {React.createElement(icon, {className: "h-6 w-6 text-muted-foreground"})}
                <CardTitle className="text-lg">{label}</CardTitle>
            </div>
            <p className="text-3xl font-bold text-primary mt-2">{value}</p>
            <p className="text-sm text-muted-foreground">{unit}</p>
        </Card>
    );

    const handleInitialAngleChange = (v: number[]) => {
      setInitialAngle(v[0]);
      if (isRunning) {
        setIsRunning(false);
      }
      setTime(0);
      setPositionHistory([]);
    }
    
    const resetSimulation = () => {
        setIsRunning(false);
        setTime(0);
        setPositionHistory([]);
    }
    
    const arcPath = useMemo(() => {
        const startAngle = -initialAngle * Math.PI / 180;
        const endAngle = initialAngle * Math.PI / 180;
        const startX = length * Math.sin(startAngle);
        const startY = length * Math.cos(startAngle);
        const endX = length * Math.sin(endAngle);
        const endY = length * Math.cos(endAngle);
        const largeArcFlag = Math.abs(endAngle - startAngle) <= Math.PI ? "0" : "1";
        return `M ${startX} ${startY} A ${length} ${length} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    }, [initialAngle, length]);

    return (
        <div className="mt-8 space-y-6">
            <Card>
                <CardHeader><CardTitle>Pendulum Controls</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="length">Length ({length.toFixed(1)} m)</Label>
                        <Slider id="length" min={0.5} max={3} step={0.1} value={[length]} onValueChange={(v) => setLength(v[0])} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mass">Mass ({mass.toFixed(1)} kg)</Label>
                        <Slider id="mass" min={0.1} max={5} step={0.1} value={[mass]} onValueChange={(v) => setMass(v[0])} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="angle">Initial Angle ({initialAngle.toFixed(1)}°)</Label>
                        <Slider id="angle" min={1} max={60} step={1} value={[initialAngle]} onValueChange={handleInitialAngleChange} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard icon={Timer} label="Period" value={period.toFixed(2)} unit="seconds" />
                <StatCard icon={MoveRight} label="Max Speed" value={maxSpeed.toFixed(2)} unit="m/s" />
            </div>

            <div className="flex justify-center gap-2">
                <Button onClick={() => setIsRunning(!isRunning)} variant="outline" size="lg">
                    {isRunning ? <><Pause className="mr-2"/> Pause</> : <><Play className="mr-2"/> Start</>}
                </Button>
                <Button onClick={resetSimulation} variant="outline" size="lg">
                    <RotateCcw className="mr-2"/> Reset
                </Button>
            </div>

            <Card className="h-[50vh] flex flex-col">
                <CardContent className="p-2 sm:p-6 flex-1 flex flex-col items-center justify-center relative">
                    <svg width="100%" height="100%" viewBox="-3 -0.5 6 4">
                         <defs>
                            <radialGradient id="bobGradient" cx="0.4" cy="0.4" r="0.6">
                                <stop offset="0%" stopColor="hsl(var(--primary-foreground))" />
                                <stop offset="100%" stopColor="hsl(var(--primary))" />
                            </radialGradient>
                        </defs>
                        <g transform="translate(0, 0)">
                             <path d={arcPath} stroke="hsl(var(--muted))" strokeDasharray="0.1 0.1" strokeWidth="0.02" fill="none" />
                             <line x1="0" y1="0" x2={bobX} y2={bobY} stroke="hsl(var(--muted-foreground))" strokeWidth="0.05" />
                             <circle cx={bobX} cy={bobY} r={0.2 * Math.cbrt(mass)} fill="url(#bobGradient)" stroke="hsl(var(--foreground))" strokeWidth="0.02" />
                        </g>
                        <line x1="-3" y1="0" x2="3" y2="0" stroke="hsl(var(--foreground))" strokeWidth="0.02" />
                    </svg>
                </CardContent>
            </Card>

            <Card className="h-[40vh]">
                <CardHeader>
                    <CardTitle>Position vs. Time</CardTitle>
                </CardHeader>
                <CardContent className="h-[80%] pr-8">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={positionHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} unit="s" name="Time" tickFormatter={(tick) => tick.toFixed(1)} />
                            <YAxis domain={[-maxDisplacement * 1.1, maxDisplacement * 1.1]} unit="m" name="Position" />
                            <Tooltip formatter={(value: number) => value.toFixed(3)} labelFormatter={(label: number) => `Time: ${label.toFixed(2)}s`} />
                            <ReferenceLine y={0} stroke="hsl(var(--border))" />
                             <Line type="monotone" dataKey="x" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} name="Horizontal Position" />
                        </LineChart>
                     </ResponsiveContainer>
                </CardContent>
            </Card>

        </div>
    );
}


export const CircuitBuilder = () => {
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('circuitBuilding');
    useEffect(() => {
        if (isUserLoading) return;
        if (!checkLimit()) return;
        incrementUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUserLoading]);
    return <ComingSoon experimentName="Circuit Building" />;
}
export const OpticsLab = () => {
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('opticsLab');
    useEffect(() => {
        if (isUserLoading) return;
        if (!checkLimit()) return;
        incrementUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUserLoading]);
    return <ComingSoon experimentName="Optics (Lenses & Mirrors)" />;
}
