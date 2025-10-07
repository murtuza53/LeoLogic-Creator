
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MoveUp, MoveRight, Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';

const GRAVITY = 9.81; // m/s^2

const ComingSoon = ({ experimentName }: { experimentName: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
    <h3 className="text-2xl font-semibold mb-2">{experimentName} Simulation</h3>
    <p className="text-muted-foreground">This feature is coming soon. Stay tuned!</p>
  </div>
);


const ProjectileMotion = () => {
    const [initialVelocity, setInitialVelocity] = useState(25);
    const [angle, setAngle] = useState(45);
    
    const timeOfFlight = useMemo(() => (2 * initialVelocity * Math.sin(angle * Math.PI / 180)) / GRAVITY, [initialVelocity, angle]);
    const maxRange = useMemo(() => (initialVelocity * initialVelocity * Math.sin(2 * angle * Math.PI / 180)) / GRAVITY, [initialVelocity, angle]);
    const maxHeight = useMemo(() => Math.pow(initialVelocity * Math.sin(angle * Math.PI / 180), 2) / (2 * GRAVITY), [initialVelocity, angle]);

    const fullPath = useMemo(() => {
        const points = [];
        for (let t = 0; t <= timeOfFlight; t += timeOfFlight / 100) {
             const x = initialVelocity * Math.cos(angle * Math.PI / 180) * t;
             const y = initialVelocity * Math.sin(angle * Math.PI / 180) * t - 0.5 * GRAVITY * t * t;
             if (y >= 0) {
                points.push({x, y});
             }
        }
        if (points.length > 0 && points[points.length-1].y !== 0 && timeOfFlight > 0) {
            const finalX = initialVelocity * Math.cos(angle * Math.PI / 180) * timeOfFlight;
            points.push({x: finalX, y: 0});
        }
        return points;
    }, [initialVelocity, angle, timeOfFlight]);

    const domainX = [0, Math.ceil(maxRange * 1.1) || 10];
    const domainY = [0, Math.ceil(maxHeight * 1.1) || 10];


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
        <div className="grid md:grid-cols-1 gap-6 h-full">
            <div className="space-y-6">
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
            </div>

            <div className="space-y-6">
                 <Card className="h-full">
                    <CardContent className="p-2 sm:p-6 h-[60vh]">
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
        </div>
    );
}

const PendulumDynamics = () => {
    const [length, setLength] = useState(1); // meters
    const [mass, setMass] = useState(1); // kg
    const [initialAngle, setInitialAngle] = useState(20); // degrees
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const animationFrameId = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);


    // Calculate physics properties
    const period = useMemo(() => 2 * Math.PI * Math.sqrt(length / GRAVITY), [length]);
    const angularFrequency = useMemo(() => Math.sqrt(GRAVITY / length), [length]);
    const maxSpeed = useMemo(() => Math.sqrt(2 * GRAVITY * length * (1 - Math.cos(initialAngle * Math.PI / 180))), [length, initialAngle]);

    const animate = useCallback((timestamp: number) => {
        if (lastTimeRef.current !== null) {
            const deltaTime = (timestamp - lastTimeRef.current) / 1000;
            setTime(prevTime => prevTime + deltaTime);
        }
        lastTimeRef.current = timestamp;
        animationFrameId.current = requestAnimationFrame(animate);
    }, []);
    
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
    const bobY = -length * Math.cos(currentAngleRad);

    const StatCard = ({ icon, label, value, unit }: { icon: React.ElementType, label: string, value: string, unit: string }) => (
        <Card className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
                {React.createElement(icon, { className: "h-6 w-6 text-muted-foreground" })}
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
    }

    return (
        <div className="grid md:grid-cols-1 gap-6 h-full">
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

            <Card className="h-[60vh] flex flex-col">
                <CardContent className="p-2 sm:p-6 flex-1 flex flex-col items-center justify-center relative">
                    <svg width="100%" height="100%" viewBox="-3 -0.5 6 4">
                        <line x1="0" y1="0" x2={bobX} y2={-bobY} stroke="hsl(var(--muted-foreground))" strokeWidth="0.05" />
                        <circle cx={bobX} cy={-bobY} r={0.2 * Math.sqrt(mass)} fill="hsl(var(--primary))" />
                        <line x1="-3" y1="0" x2="3" y2="0" stroke="hsl(var(--foreground))" strokeWidth="0.1" />
                    </svg>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        <Button onClick={() => setIsRunning(!isRunning)} variant="outline" size="lg">
                            {isRunning ? <><Pause className="mr-2"/> Pause</> : <><Play className="mr-2"/> Start</>}
                        </Button>
                        <Button onClick={() => { setIsRunning(false); setTime(0); }} variant="outline" size="lg">
                            <RotateCcw className="mr-2"/> Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

const CircuitBuilder = () => {
    return <ComingSoon experimentName="Circuit Building" />;
}
const OpticsLab = () => {
    return <ComingSoon experimentName="Optics (Lenses & Mirrors)" />;
}

export default function VirtualPhysicsLab() {

  return (
    <div className="mt-8">
      <Tabs defaultValue="projectile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="projectile">Projectile Motion</TabsTrigger>
          <TabsTrigger value="pendulum">Pendulum Dynamics</TabsTrigger>
          <TabsTrigger value="circuits">Circuit Building</TabsTrigger>
          <TabsTrigger value="optics">Optics</TabsTrigger>
        </TabsList>
        <Card className="mt-4 shadow-lg">
            <CardContent className="p-6 min-h-[80vh] flex">
                <TabsContent value="projectile" className="w-full mt-0">
                    <ProjectileMotion />
                </TabsContent>
                <TabsContent value="pendulum" className="w-full mt-0">
                    <PendulumDynamics />
                </TabsContent>
                <TabsContent value="circuits" className="w-full mt-0">
                    <CircuitBuilder />
                </TabsContent>
                <TabsContent value="optics" className="w-full mt-0">
                    <OpticsLab />
                </TabsContent>
            </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
