
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
      <h3 className="text-2xl font-semibold mb-2">{experimentName}</h3>
      <p className="text-muted-foreground">This feature is coming soon. Stay tuned!</p>
    </div>
);


export const ProjectileMotion = () => {
    const [initialVelocity, setInitialVelocity] = useState(35);
    const [angle, setAngle] = useState(45);
    const [simulationTime, setSimulationTime] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [pathData, setPathData] = useState<{x: number, y: number}[]>([]);
    
    const animationFrameId = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
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

    const ballPosition = useMemo(() => {
        const t = Math.min(simulationTime, timeOfFlight);
        const x = initialVelocity * Math.cos(angle * Math.PI / 180) * t;
        const y = initialVelocity * Math.sin(angle * Math.PI / 180) * t - 0.5 * GRAVITY * t * t;
        return { x, y };
    }, [initialVelocity, angle, simulationTime, timeOfFlight]);
    
    const animate = useCallback((timestamp: number) => {
        if (lastTimeRef.current !== null) {
            const deltaTime = (timestamp - lastTimeRef.current) / 1000;
            setSimulationTime(prevTime => {
                const newTime = prevTime + deltaTime * 2; // Speed up simulation
                if (newTime >= timeOfFlight) {
                    setIsSimulating(false);
                    return timeOfFlight;
                }
                return newTime;
            });
        }
        lastTimeRef.current = timestamp;
        if (isSimulating) {
           animationFrameId.current = requestAnimationFrame(animate);
        }
    }, [timeOfFlight, isSimulating]);

    useEffect(() => {
        if (isSimulating) {
            lastTimeRef.current = performance.now();
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isSimulating, animate]);
    
    useEffect(() => {
        if(isSimulating) {
            setPathData(prev => [...prev, ballPosition]);
        }
    }, [ballPosition, isSimulating]);

    const startSimulation = () => {
        if (isSimulating) return;
        setSimulationTime(0);
        setPathData([]);
        setIsSimulating(true);
    };

    const resetSimulation = () => {
        setIsSimulating(false);
        setSimulationTime(0);
        setPathData([]);
    };
    
    const { viewBoxWidth, viewBoxHeight, scale, groundY, cannonX } = useMemo(() => {
        const vbWidth = maxRange > 0 ? maxRange * 1.1 : 100;
        const vbHeight = maxHeight > 0 ? maxHeight * 1.2 : 50;
        return {
            viewBoxWidth: vbWidth,
            viewBoxHeight: vbHeight,
            scale: 1, // We now use viewBox for scaling
            groundY: vbHeight * 0.9,
            cannonX: vbWidth * 0.02,
        };
    }, [maxRange, maxHeight]);


    const StatCard = ({ icon, label, value, unit }: { icon: React.ElementType, label: string, value: string, unit: string }) => (
        <Card className="p-3 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
                {React.createElement(icon, {className: "h-5 w-5 text-muted-foreground"})}
                <CardTitle className="text-base">{label}</CardTitle>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{value}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
        </Card>
    );

    return (
        <div className="mt-8 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Cannon Controls</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="velocity">Initial Velocity ({initialVelocity.toFixed(1)} m/s)</Label>
                        <Slider disabled={isSimulating} id="velocity" min={10} max={60} step={1} value={[initialVelocity]} onValueChange={(v) => { resetSimulation(); setInitialVelocity(v[0]); }} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="angle">Launch Angle ({angle.toFixed(1)}°)</Label>
                        <Slider disabled={isSimulating} id="angle" min={15} max={75} step={1} value={[angle]} onValueChange={(v) => { resetSimulation(); setAngle(v[0]); }} />
                    </div>
                    <div className="flex gap-2">
                         <Button onClick={startSimulation} disabled={isSimulating} className="w-full" size="lg">Fire!</Button>
                         <Button onClick={resetSimulation} variant="outline" size="lg"><RotateCcw /></Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={MoveRight} label="Max Distance" value={maxRange.toFixed(2)} unit="meters" />
                <StatCard icon={MoveUp} label="Peak Height" value={maxHeight.toFixed(2)} unit="meters" />
                <StatCard icon={Timer} label="Time of Flight" value={timeOfFlight.toFixed(2)} unit="seconds" />
                <StatCard icon={Timer} label="Time" value={simulationTime.toFixed(2)} unit="seconds" />
            </div>

            <Card className="p-2 sm:p-4">
                 <div className="relative aspect-[2/1] w-full bg-blue-50 dark:bg-blue-900/20 rounded-md overflow-hidden border">
                    <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="xMidYMax meet">
                        <g transform={`translate(0, ${viewBoxHeight}) scale(1, -1)`}>
                            {/* Background landscape */}
                            <path d={`M -5,${viewBoxHeight * 0.1} C ${viewBoxWidth * 0.3},${viewBoxHeight * 0.05} ${viewBoxWidth * 0.6},${viewBoxHeight * 0.15} ${viewBoxWidth + 5},${viewBoxHeight * 0.12} L ${viewBoxWidth + 5},0 L -5,0 Z`} fill="hsl(var(--success))" opacity="0.2"/>

                            {/* Ground */}
                            <line x1="0" y1={viewBoxHeight * 0.1} x2={viewBoxWidth} y2={viewBoxHeight * 0.1} stroke="hsl(var(--success-foreground))" strokeWidth={viewBoxHeight * 0.005} />
                            
                            {/* Cannon */}
                            <g transform={`translate(${cannonX}, ${viewBoxHeight * 0.1})`}>
                                <g transform={`rotate(${angle})`}>
                                    <rect x="-0.5" y={-viewBoxHeight * 0.015} width={viewBoxWidth * 0.05} height={viewBoxHeight * 0.03} fill="hsl(var(--foreground))" rx={viewBoxHeight * 0.01}/>
                                </g>
                                <circle cx="0" cy="0" r={viewBoxHeight * 0.04} fill="hsl(var(--foreground))" />
                                <circle cx={-viewBoxWidth * 0.01} cy={-viewBoxHeight * 0.01} r={viewBoxHeight * 0.02} fill="hsl(var(--muted-foreground))" />
                                <circle cx={viewBoxWidth * 0.01} cy={-viewBoxHeight * 0.01} r={viewBoxHeight * 0.02} fill="hsl(var(--muted-foreground))" />
                            </g>
                            
                            {/* Trajectory Path */}
                            {pathData.length > 1 && (
                                <path 
                                    d={`M ${cannonX + pathData[0].x} ${viewBoxHeight * 0.1 + pathData[0].y} ` + pathData.map(p => `L ${cannonX + p.x} ${viewBoxHeight * 0.1 + p.y}`).join(' ')}
                                    fill="none"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={viewBoxHeight * 0.005}
                                    strokeDasharray="0.2 0.2"
                                />
                            )}

                            {/* Cannonball */}
                            <circle 
                                cx={cannonX + ballPosition.x} 
                                cy={viewBoxHeight * 0.1 + ballPosition.y} 
                                r={viewBoxHeight * 0.015}
                                fill="hsl(var(--destructive))" 
                            />
                        </g>
                    </svg>
                </div>
            </Card>
        </div>
    );
}

export const PendulumDynamics = () => {
    const initialValues = useRef({ length: 1.5, mass: 1, initialAngle: 30 });
    const [length, setLength] = useState(initialValues.current.length);
    const [mass, setMass] = useState(initialValues.current.mass);
    const [initialAngle, setInitialAngle] = useState(initialValues.current.initialAngle);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [positionHistory, setPositionHistory] = useState<{time: number, x: number}[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
        setLength(initialValues.current.length);
        setMass(initialValues.current.mass);
        setInitialAngle(initialValues.current.initialAngle);
    }, []);

    const animationFrameId = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('pendulumDynamics');
    
    useEffect(() => {
      if (isUserLoading || !isMounted) return;
      if (!checkLimit()) return;
      incrementUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUserLoading, isMounted]);

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
            }
            lastTimeRef.current = null;
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isRunning, animate]);

    const { viewBox, arcPath, bobX, bobY, bobRadius, cordWidth, scaleFactor } = useMemo(() => {
        if (!isMounted) return { viewBox: "0 0 100 100", arcPath: "", bobX: 0, bobY: 0, bobRadius: 0, cordWidth: 0, scaleFactor: 1 };
    
        const canvasHeight = 100;
        const dynamicScaleFactor = canvasHeight / (length * 1.2);
    
        const scaledLength = length * dynamicScaleFactor;
    
        const currentAngleRad = (initialAngle * Math.PI / 180) * Math.cos(angularFrequency * time);
        const currentBobX = scaledLength * Math.sin(currentAngleRad);
        const currentBobY = scaledLength * Math.cos(currentAngleRad);
    
        const startAngle = -initialAngle * Math.PI / 180;
        const endAngle = initialAngle * Math.PI / 180;
    
        const startX = scaledLength * Math.sin(startAngle);
        const startY = scaledLength * Math.cos(startAngle);
        const endX = scaledLength * Math.sin(endAngle);
        const endY = scaledLength * Math.cos(endAngle);
        const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
        const newArcPath = `M ${startX} ${startY} A ${scaledLength} ${scaledLength} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
        const viewboxWidth = 2.2 * scaledLength * Math.sin(initialAngle * Math.PI / 180);
        const viewboxHeight = scaledLength + (0.1 * scaledLength);
        
        const vb = `${-viewboxWidth/2} 0 ${viewboxWidth} ${viewboxHeight}`;

        const dynamicBobRadius = 0.05 * dynamicScaleFactor * Math.cbrt(mass) * 2;
        const dynamicCordWidth = 0.005 * dynamicScaleFactor * 2;
    
        return {
            viewBox: vb,
            arcPath: newArcPath,
            bobX: currentBobX,
            bobY: currentBobY,
            bobRadius: dynamicBobRadius,
            cordWidth: dynamicCordWidth,
            scaleFactor: dynamicScaleFactor,
        };
    }, [isMounted, length, mass, initialAngle, angularFrequency, time]);


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

            <Card className="h-[60vh] flex flex-col">
                <CardContent className="p-2 sm:p-6 flex-1 flex flex-col items-center justify-center relative">
                    <svg width="100%" height="100%" viewBox={viewBox}>
                         <defs>
                            <radialGradient id="bobGradient" cx="0.4" cy="0.4" r="0.6">
                                <stop offset="0%" stopColor="hsl(var(--primary-foreground))" />
                                <stop offset="100%" stopColor="hsl(var(--primary))" />
                            </radialGradient>
                        </defs>
                        <g>
                            <path d={arcPath} stroke="hsl(var(--muted))" strokeDasharray="0.1 0.1" strokeWidth={0.01 * scaleFactor} fill="none" />
                            <line x1="0" y1="0" x2={bobX} y2={bobY} stroke="hsl(var(--muted-foreground))" strokeWidth={cordWidth} />
                            <circle cx={bobX} cy={bobY} r={bobRadius} fill="url(#bobGradient)" stroke="hsl(var(--foreground))" strokeWidth={0.005 * scaleFactor} />
                        </g>
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
                            <YAxis domain={[-maxDisplacement * 1.1, maxDisplacement * 1.1]} unit="m" name="Position" tickFormatter={(tick) => tick.toFixed(1)}/>
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
