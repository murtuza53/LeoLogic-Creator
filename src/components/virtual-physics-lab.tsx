
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MoveUp, MoveRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';

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
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard icon={MoveRight} label="Max Distance" value={maxRange.toFixed(2)} unit="meters" />
                    <StatCard icon={MoveUp} label="Peak Height" value={maxHeight.toFixed(2)} unit="meters" />
                </div>
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
