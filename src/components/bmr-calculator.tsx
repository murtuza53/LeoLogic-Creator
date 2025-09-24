
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { incrementFeatureCounterAction } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  height_cm: z.coerce.number().optional(),
  height_ft: z.coerce.number().optional(),
  height_in: z.coerce.number().optional(),
  weight_kg: z.coerce.number().optional(),
  weight_lb: z.coerce.number().optional(),
  age: z.coerce.number().int().min(15, "Age must be at least 15.").max(80, "Age must be at most 80."),
  gender: z.enum(['male', 'female'], { required_error: "Please select a gender." }),
  unit: z.enum(['metric', 'imperial']).default('metric'),
}).refine(data => {
    if (data.unit === 'metric') {
        return data.height_cm && data.height_cm > 0 && data.weight_kg && data.weight_kg > 0;
    }
    if (data.unit === 'imperial') {
        return data.height_ft && data.height_ft > 0 && data.height_in !== undefined && data.height_in >= 0 && data.weight_lb && data.weight_lb > 0;
    }
    return false;
}, {
    message: "Please fill out all required fields for the selected unit system.",
    path: ["age"], // General message, attached to a field to show up.
});

type BmrResult = {
  bmr: number;
  activityLevels: { level: string; calories: number; description?: string }[];
};

const activityMultipliers = [
    { level: 'Sedentary', multiplier: 1.2, description: 'little or no exercise' },
    { level: 'Exercise 1-3 times/week', multiplier: 1.375 },
    { level: 'Exercise 4-5 times/week', multiplier: 1.465 },
    { level: 'Daily exercise or intense exercise 3-4 times/week', multiplier: 1.55 },
    { level: 'Intense exercise 6-7 times/week', multiplier: 1.725 },
    { level: 'Very intense exercise daily, or physical job', multiplier: 1.9 },
];

const levelColors = [
    "bg-blue-50 hover:bg-blue-100/50",
    "bg-green-50 hover:bg-green-100/50",
    "bg-yellow-50 hover:bg-yellow-100/50",
    "bg-orange-50 hover:bg-orange-100/50",
    "bg-red-50 hover:bg-red-100/50",
    "bg-purple-50 hover:bg-purple-100/50",
];

export default function BmrCalculator() {
  const [result, setResult] = useState<BmrResult | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: 'metric',
      gender: 'male',
      age: 25,
      height_cm: undefined,
      height_ft: undefined,
      height_in: undefined,
      weight_kg: undefined,
      weight_lb: undefined,
    },
  });
  
  const unit = form.watch('unit');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let heightInCm: number;
    let weightInKg: number;

    if (values.unit === 'imperial') {
      const totalInches = (values.height_ft! * 12) + (values.height_in || 0);
      heightInCm = totalInches * 2.54;
      weightInKg = values.weight_lb! * 0.453592;
    } else {
      heightInCm = values.height_cm!;
      weightInKg = values.weight_kg!;
    }
    
    // Mifflin-St Jeor Equation
    let bmr: number;
    if (values.gender === 'male') {
        bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * values.age) + 5;
    } else {
        bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * values.age) - 161;
    }

    const activityLevels = activityMultipliers.map(activity => ({
        ...activity,
        calories: Math.round(bmr * activity.multiplier),
    }));

    setResult({ bmr: Math.round(bmr), activityLevels });

    try {
      await incrementFeatureCounterAction('bmrCalculator');
      router.refresh();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Counter Error",
        description: "Could not update the global counter.",
      });
    }
  }
  
  const resetForm = () => {
    form.reset({
        unit: 'metric',
        gender: 'male',
        age: 25,
        height_cm: undefined,
        height_ft: undefined,
        height_in: undefined,
        weight_kg: undefined,
        weight_lb: undefined,
    });
    setResult(null);
  }

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Enter Your Details</CardTitle>
          <CardDescription>Provide your details to calculate your BMR.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Units</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={(e) => {
                                field.onChange(e);
                                resetForm();
                            }}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="metric" /></FormControl>
                                <FormLabel className="font-normal">Metric (cm, kg)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="imperial" /></FormControl>
                                <FormLabel className="font-normal">Imperial (ft, in, lb)</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g. 25" {...field} value={field.value ?? ''} /></FormControl>
                    <FormDescription>Ages: 15 - 80</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="male" /></FormControl>
                          <FormLabel className="font-normal">Male</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="female" /></FormControl>
                          <FormLabel className="font-normal">Female</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {unit === 'metric' ? (
                <div className='grid grid-cols-2 gap-4'>
                    <FormField control={form.control} name="height_cm" render={({ field }) => (
                        <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="180" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="weight_kg" render={({ field }) => (
                        <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="75" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
              ) : (
                <div className='space-y-4'>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="height_ft" render={({ field }) => (
                            <FormItem><FormLabel>Height (ft)</FormLabel><FormControl><Input type="number" placeholder="5" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="height_in" render={({ field }) => (
                            <FormItem><FormLabel>Height (in)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="weight_lb" render={({ field }) => (
                        <FormItem><FormLabel>Weight (lb)</FormLabel><FormControl><Input type="number" placeholder="165" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
              )}


              <div className="flex gap-4 pt-4">
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                  Calculate
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {result ? (
                <>
                  <div className='text-center border-b pb-4'>
                    <p className='text-muted-foreground'>Basal Metabolic Rate (BMR)</p>
                    <p className='text-4xl font-bold text-primary'>{result.bmr.toLocaleString()} <span className='text-lg font-medium text-muted-foreground'>Calories/day</span></p>
                  </div>
                  <div>
                    <h4 className='font-semibold mb-2'>Daily Calorie Needs Based on Activity Level</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Activity Level</TableHead>
                                <TableHead className='text-right'>Calories</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.activityLevels.map((activity, index) => (
                                <TableRow key={activity.level} className={cn(levelColors[index % levelColors.length])}>
                                    <TableCell>
                                        <p className='font-medium'>{activity.level}</p>
                                        {activity.description && <p className='text-xs text-muted-foreground'>{activity.description}</p>}
                                    </TableCell>
                                    <TableCell className='text-right font-semibold text-lg'>{activity.calories.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className='text-xs text-muted-foreground mt-4 space-y-1 border-t pt-4'>
                        <p><span className='font-semibold'>Exercise:</span> 15-30 minutes of elevated heart rate activity.</p>
                        <p><span className='font-semibold'>Intense exercise:</span> 45-120 minutes of elevated heart rate activity.</p>
                        <p><span className='font-semibold'>Very intense exercise:</span> 2+ hours of elevated heart rate activity.</p>
                    </div>
                  </div>
                </>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-64 flex items-center justify-center">
                    <p>Your calculated BMR will appear here.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
