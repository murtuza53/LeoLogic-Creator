
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, MoveUp, MoveRight, Sigma } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Dot, Customized } from 'recharts';

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
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [path, setPath] = useState<{x: number, y: number}[]>([]);
    
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
        return points;
    }, [initialVelocity, angle, timeOfFlight]);


    useEffect(() => {
        let animationFrameId: number;

        if (isRunning) {
            const animate = () => {
                setTime(t => {
                    const newTime = t + 0.02;
                    if (newTime > timeOfFlight) {
                        setIsRunning(false);
                        const finalX = initialVelocity * Math.cos(angle * Math.PI / 180) * timeOfFlight;
                        setPath(prevPath => [...prevPath, {x: finalX, y: 0}]);
                        return timeOfFlight;
                    }

                    const x = initialVelocity * Math.cos(angle * Math.PI / 180) * newTime;
                    const y = initialVelocity * Math.sin(angle * Math.PI / 180) * newTime - 0.5 * GRAVITY * newTime * newTime;
                    
                    if (y >= 0) {
                        setPath(prevPath => [...prevPath, {x, y}]);
                    } else if (path.length > 0 && path[path.length - 1].y > 0) {
                        // Ensure we land at y=0, not below
                        const finalX = initialVelocity * Math.cos(angle * Math.PI / 180) * timeOfFlight;
                        setPath(prevPath => [...prevPath, {x: finalX, y: 0}]);
                    }

                    animationFrameId = requestAnimationFrame(animate);
                    return newTime;
                });
            };
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isRunning, initialVelocity, angle, timeOfFlight, path]);

    const handleLaunch = () => {
        resetSimulation();
        setIsRunning(true);
    };

    const handlePause = () => {
        setIsRunning(!isRunning);
    };

    const resetSimulation = () => {
        setIsRunning(false);
        setTime(0);
        setPath([]);
    };

    const projectilePosition = path[path.length - 1] || { x: 0, y: 0 };

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
        <div className="grid md:grid-cols-3 gap-6 h-full">
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="velocity">Initial Velocity ({initialVelocity.toFixed(1)} m/s)</Label>
                            <Slider id="velocity" min={1} max={50} step={0.5} value={[initialVelocity]} onValueChange={(v) => setInitialVelocity(v[0])} disabled={isRunning} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="angle">Launch Angle ({angle.toFixed(1)}°)</Label>
                            <Slider id="angle" min={0} max={90} step={0.5} value={[angle]} onValueChange={(v) => setAngle(v[0])} disabled={isRunning} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="gravity">Gravity</Label>
                            <Input id="gravity" value={`${GRAVITY} m/s²`} disabled />
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-3 gap-2">
                    <Button onClick={handleLaunch} disabled={isRunning} className="bg-green-600 hover:bg-green-700">
                        <Play className="mr-2" /> Launch
                    </Button>
                    <Button onClick={handlePause} variant="outline">
                        {isRunning ? <><Pause className="mr-2" /> Pause</> : <><Play className="mr-2" /> Resume</>}
                    </Button>
                    <Button onClick={resetSimulation} variant="destructive">
                        <RefreshCw className="mr-2" /> Reset
                    </Button>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard icon={MoveRight} label="Max Distance" value={maxRange.toFixed(2)} unit="meters" />
                    <StatCard icon={MoveUp} label="Peak Height" value={maxHeight.toFixed(2)} unit="meters" />
                 </div>
            </div>

            <div className="md:col-span-2">
                 <Card className="h-full">
                    <CardContent className="p-2 sm:p-6 h-[70vh]">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                                data={fullPath} 
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    type="number" 
                                    dataKey="x" 
                                    name="Distance" 
                                    unit="m" 
                                    domain={[0, 'dataMax']} 
                                    label={{ value: 'Distance (m)', position: 'insideBottom', offset: -15 }}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="y" 
                                    name="Height" 
                                    unit="m" 
                                    domain={[0, 'dataMax']}
                                    label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', offset: 10 }}
                                />
                                <Tooltip formatter={(value: number) => value.toFixed(2)} />
                                <Line 
                                    type="monotone" 
                                    dataKey="y" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={2} 
                                    dot={false}
                                    name="Trajectory"
                                />
                                {isRunning && (
                                     <Line type="monotone" data={path} dataKey="y" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} />
                                )}
                                {isRunning && path.length > 0 && (
                                    <Customized component={
                                        <Dot
                                            r={8}
                                            cx={projectilePosition.x}
                                            cy={projectilePosition.y}
                                            fill="hsl(var(--accent))"
                                            className="animate-pulse"
                                        />
                                    } />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const PendulumDynamics = () => {
    return <ComingSoon experimentName="Pendulum Dynamics" />;
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
