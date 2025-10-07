
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MoveUp, MoveRight, Play, Pause, RotateCcw, Timer, Pencil, Minus, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from './ui/button';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';

const GRAVITY = 9.81; // m/s^2

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
    
    const { viewBoxWidth, viewBoxHeight, cannonX, cannonY, cannonWidth, cannonHeight, wheelRadius } = useMemo(() => {
        const fixedWidth = 1200;
        const fixedHeight = fixedWidth / 4; 
        return {
            viewBoxWidth: fixedWidth,
            viewBoxHeight: fixedHeight,
            cannonX: 10,
            cannonY: fixedHeight * 0.1,
            cannonWidth: 20,
            cannonHeight: 6,
            wheelRadius: 4,
        };
    }, []);


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
                        <Slider disabled={isSimulating} id="velocity" min={10} max={100} step={1} value={[initialVelocity]} onValueChange={(v) => { resetSimulation(); setInitialVelocity(v[0]); }} />
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
                 <div className="relative aspect-[3/1] w-full bg-blue-100 dark:bg-blue-900/30 rounded-md overflow-hidden border">
                    <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="xMidYMax meet">
                        <g transform={`translate(0, ${viewBoxHeight}) scale(1, -1)`}>
                            {/* Background landscape */}
                            <path d={`M -5,${viewBoxHeight * 0.1} C ${viewBoxWidth * 0.2},${viewBoxHeight * 0.2} ${viewBoxWidth * 0.5},${viewBoxHeight * 0.05} ${viewBoxWidth + 5},${viewBoxHeight * 0.15} L ${viewBoxWidth + 5},0 L -5,0 Z`} fill="#a8e6cf" />
                            <path d={`M -5,${viewBoxHeight * 0.1} C ${viewBoxWidth * 0.3},${viewBoxHeight * 0.15} ${viewBoxWidth * 0.6},${viewBoxHeight * 0.08} ${viewBoxWidth + 5},${viewBoxHeight * 0.1} L ${viewBoxWidth + 5},0 L -5,0 Z`} fill="#dcedc1" />

                             {/* House */}
                             <g transform={`translate(${viewBoxWidth * 0.8}, ${viewBoxHeight * 0.1}) scale(0.2)`}>
                                <rect x="0" y="0" width="100" height="60" fill="#f7d8a3" />
                                <polygon points="0,60 100,60 50,100" fill="#c0392b" />
                                <rect x="40" y="10" width="20" height="30" fill="#89cff0" />
                            </g>

                            {/* Ground */}
                            <line x1="0" y1={cannonY} x2={viewBoxWidth} y2={cannonY} stroke="#6B8E23" strokeWidth="1" />
                            
                            {/* Cannon */}
                            <g transform={`translate(${cannonX}, ${cannonY})`}>
                                <g transform={`rotate(${angle})`}>
                                    <rect x="-2" y={-cannonHeight / 2} width={cannonWidth} height={cannonHeight} fill="hsl(var(--foreground))" rx="2"/>
                                </g>
                                <circle cx="0" cy="0" r={wheelRadius * 1.5} fill="hsl(var(--foreground))" />
                                <circle cx={-wheelRadius * 1.8} cy={-wheelRadius * 0.5} r={wheelRadius} fill="hsl(var(--muted-foreground))" />
                                <circle cx={wheelRadius * 1.8} cy={-wheelRadius * 0.5} r={wheelRadius} fill="hsl(var(--muted-foreground))" />
                            </g>
                            
                            {/* Trajectory Path */}
                            {pathData.length > 1 && (
                                <path 
                                    d={`M ${cannonX + pathData[0].x} ${cannonY + pathData[0].y} ` + pathData.map(p => `L ${cannonX + p.x} ${cannonY + p.y}`).join(' ')}
                                    fill="none"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={0.5}
                                    strokeDasharray="1 1"
                                />
                            )}

                            {/* Cannonball */}
                            <circle 
                                cx={cannonX + ballPosition.x} 
                                cy={cannonY + ballPosition.y} 
                                r="2.5"
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

    const maxDisplacement = useMemo(() => length * Math.sin(initialAngle * Math.PI / 180), [length, initialAngle]);

    const { viewBox, bobX, bobY, bobRadius, stringLength, pivotX, pivotY } = useMemo(() => {
        const canvasSize = 500;
        const scaleFactor = canvasSize / 4 / length; 
        const pX = canvasSize / 2;
        const pY = 20;

        const currentAngleRad = (initialAngle * Math.PI / 180) * Math.cos(angularFrequency * time);
        
        return {
            viewBox: `0 0 ${canvasSize} ${canvasSize}`,
            pivotX: pX,
            pivotY: pY,
            stringLength: length * scaleFactor,
            bobX: pX + (length * scaleFactor * Math.sin(currentAngleRad)),
            bobY: pY + (length * scaleFactor * Math.cos(currentAngleRad)),
            bobRadius: Math.max(8, 12 * Math.cbrt(mass)),
        };
    }, [length, mass, initialAngle, angularFrequency, time]);


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
                            <radialGradient id="bobGradientRed" cx="0.3" cy="0.3" r="0.7">
                                <stop offset="0%" stopColor="#fca5a5" /> 
                                <stop offset="100%" stopColor="#b91c1c" /> 
                            </radialGradient>
                        </defs>
                        {/* Rigid Support */}
                        <rect x={pivotX - 100} y={pivotY - 5} width="200" height="10" fill="hsl(var(--muted))" rx="3" />
                        {/* String */}
                        <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="hsl(var(--foreground))" strokeWidth="2" />
                        {/* Bob */}
                        <circle cx={bobX} cy={bobY} r={bobRadius} fill="url(#bobGradientRed)" />
                        {/* Pivot */}
                        <circle cx={pivotX} cy={pivotY} r="5" fill="hsl(var(--foreground))" />
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
    if (!isUserLoading) {
      if (!checkLimit()) return;
      incrementUsage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading]);

  // State variables for the simulation
  const [lensType, setLensType] = useState<'convex' | 'concave'>('convex');
  const [radius, setRadius] = useState(80);
  const [refractiveIndex, setRefractiveIndex] = useState(1.50);
  const [diameter, setDiameter] = useState(80);
  const [objectPosition, setObjectPosition] = useState(-120); // cm
  const [showFocalPoints, setShowFocalPoints] = useState(true);
  
  const objectHeight = 20; // Fixed object height

  // SVG dimensions and scaling
  const svgWidth = 800;
  const svgHeight = 400;
  const scale = 1.5; // pixels per cm
  const axisY = svgHeight / 2;
  const lensPositionX = svgWidth / 2;

  // Physics calculations
  const focalLength = useMemo(() => {
    if (radius === 0) return lensType === 'convex' ? Infinity : -Infinity;
    // Lensmaker's equation for a thin biconvex/biconcave lens
    const f = (radius * scale) / (2 * (refractiveIndex - 1));
    return lensType === 'convex' ? f : -f;
  }, [radius, refractiveIndex, lensType]);

  const { imagePosition, imageHeight, isVirtual } = useMemo(() => {
    const u = objectPosition * scale; // object distance
    if (u === 0) return { imagePosition: 0, imageHeight: 0, isVirtual: false };
    
    // Thin lens equation: 1/f = 1/v - 1/u
    const v = 1 / (1 / focalLength + 1 / u); // image distance
    const magnification = v / u;
    
    return {
      imagePosition: v / scale,
      imageHeight: magnification * objectHeight,
      isVirtual: (lensType === 'convex' && u > -focalLength) || lensType === 'concave',
    };
  }, [objectPosition, focalLength, lensType]);

  // Draggable object logic
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const newX = (e.clientX - CTM.e) / CTM.a;
    const newObjectPosCm = (newX - lensPositionX) / scale;
    setObjectPosition(Math.max(-250, Math.min(-10, newObjectPosCm)));
  };

  const objX = lensPositionX + objectPosition * scale;
  const imgX = lensPositionX + imagePosition * scale;

  return (
    <div className="mt-8 space-y-4">
      <Card>
        <CardContent 
            className="p-2 sm:p-4"
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseUp}
        >
          <svg ref={svgRef} width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            {/* Principal Axis */}
            <line x1="0" y1={axisY} x2={svgWidth} y2={axisY} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
            
            {/* Ruler */}
            <g transform={`translate(${lensPositionX}, ${axisY + 40})`}>
              <rect x={-250*scale} y="0" width={500*scale} height="20" fill="#f0e6d2" stroke="#b3a284"/>
              {Array.from({ length: 51 }).map((_, i) => {
                const x = (i * 10 - 250) * scale;
                const isMajor = i % 5 === 0;
                return <g key={i}>
                  <line x1={x} y1="0" x2={x} y2={isMajor ? 10 : 5} stroke="#333" />
                  {isMajor && <text x={x} y="18" textAnchor="middle" fontSize="10">{i*10 - 250}</text>}
                </g>
              })}
            </g>

            {/* Object (Pencil) */}
            <g transform={`translate(${objX}, ${axisY - objectHeight})`} onMouseDown={handleMouseDown} style={{cursor: isDragging ? 'grabbing': 'grab'}}>
                <rect x="-10" y="-5" width="20" height={objectHeight+10} fill='transparent' />
                <Pencil transform={`translate(0, ${objectHeight}) scale(1, -1)`} height={objectHeight} width={objectHeight/2} strokeWidth={1.5}/>
            </g>
            
            {/* Lens */}
            <path
              d={`M ${lensPositionX} ${axisY - diameter / 2}
                  C ${lensPositionX + (lensType === 'convex' ? 20 : -20)} ${axisY - diameter / 4},
                    ${lensPositionX + (lensType === 'convex' ? 20 : -20)} ${axisY + diameter / 4},
                    ${lensPositionX} ${axisY + diameter / 2}
                  C ${lensPositionX + (lensType === 'convex' ? -20 : 20)} ${axisY + diameter / 4},
                    ${lensPositionX + (lensType === 'convex' ? -20 : 20)} ${axisY - diameter / 4},
                    ${lensPositionX} ${axisY - diameter / 2}
                 `}
              fill="rgba(150, 180, 255, 0.5)"
              stroke="rgba(100, 120, 200, 0.8)"
              strokeWidth="2"
            />
            <line x1={lensPositionX} y1={axisY-diameter/2-5} x2={lensPositionX} y2={axisY+diameter/2+5} stroke="rgba(100,120,200,0.5)" />

            {/* Rays */}
            <g strokeWidth="1" stroke="black" fill="none">
              {/* Ray 1: Parallel -> Focal Point */}
              <line x1={objX} y1={axisY - objectHeight} x2={lensPositionX} y2={axisY - objectHeight} />
              <line x1={lensPositionX} y1={axisY - objectHeight} x2={imgX} y2={axisY - imageHeight} strokeDasharray={isVirtual ? "5 5" : "0"} />
              {/* Ray 2: Center -> Undeflected */}
              <line x1={objX} y1={axisY - objectHeight} x2={imgX} y2={axisY - imageHeight} />
              {/* Ray 3: Focal Point -> Parallel */}
              <line x1={objX} y1={axisY - objectHeight} x2={lensPositionX} y2={axisY - imageHeight*objectPosition*scale/focalLength} />
              <line x1={lensPositionX} y1={axisY - imageHeight*objectPosition*scale/focalLength} x2={imgX} y2={axisY - imageHeight} strokeDasharray={isVirtual ? "5 5" : "0"} />
            </g>
            
            {/* Image (Pencil) */}
            <g opacity={isVirtual ? 0.5 : 1}>
                <Pencil transform={`translate(${imgX}, ${axisY - imageHeight}) scale(1, -1)`} height={Math.abs(imageHeight)} width={Math.abs(imageHeight)/2} strokeWidth={1.5} />
            </g>
            
            {/* Focal Points */}
            {showFocalPoints && <>
              <circle cx={lensPositionX + focalLength} cy={axisY} r="5" fill="yellow" stroke="black"/>
              <circle cx={lensPositionX - focalLength} cy={axisY} r="5" fill="yellow" stroke="black"/>
              <text x={lensPositionX + focalLength + 8} y={axisY + 5} fontSize="12">F</text>
              <text x={lensPositionX - focalLength - 18} y={axisY + 5} fontSize="12">F</text>
            </>}

          </svg>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <div className="space-y-2">
                <Label>Lens Type</Label>
                 <ToggleGroup type="single" value={lensType} onValueChange={(v: 'convex' | 'concave') => v && setLensType(v)} className="w-full grid grid-cols-2">
                    <ToggleGroupItem value="convex">Convex</ToggleGroupItem>
                    <ToggleGroupItem value="concave">Concave</ToggleGroupItem>
                </ToggleGroup>
            </div>
            <div className="space-y-2">
                <Label>Radius of Curvature ({radius} cm)</Label>
                <Slider min={10} max={200} step={5} value={[radius]} onValueChange={(v) => setRadius(v[0])} />
            </div>
            <div className="space-y-2">
                <Label>Index of Refraction ({refractiveIndex.toFixed(2)})</Label>
                <Slider min={1.1} max={2.5} step={0.01} value={[refractiveIndex]} onValueChange={(v) => setRefractiveIndex(v[0])} />
            </div>
            <div className="space-y-2">
                <Label>Diameter ({diameter} cm)</Label>
                <Slider min={20} max={150} step={5} value={[diameter]} onValueChange={(v) => setDiameter(v[0])} />
            </div>
            <div className="lg:col-span-4 flex items-center space-x-4">
                <Checkbox id="focal-points" checked={showFocalPoints} onCheckedChange={(c) => setShowFocalPoints(c as boolean)} />
                <Label htmlFor="focal-points">Show Focal Points (F)</Label>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
