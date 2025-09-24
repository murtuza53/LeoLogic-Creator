
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

const activityLevels = [
    { name: 'Basal Metabolic Rate (BMR)', value: 1.0 },
    { name: 'Sedentary: little or no exercise', value: 1.2 },
    { name: 'Light: exercise 1-3 times/week', value: 1.375 },
    { name: 'Moderate: exercise 4-5 times/week', value: 1.465 },
    { name: 'Active: daily exercise or intense exercise 3-4 times/week', value: 1.55 },
    { name: 'Very Active: intense exercise 6-7 times/week', value: 1.725 },
    { name: 'Extra Active: very intense exercise daily, or physical job', value: 1.9 },
] as const;

const formSchema = z.object({
  height_cm: z.coerce.number().optional(),
  height_ft: z.coerce.number().optional(),
  height_in: z.coerce.number().optional(),
  weight_kg: z.coerce.number().optional(),
  weight_lb: z.coerce.number().optional(),
  age: z.coerce.number().int().min(15, "Age must be at least 15.").max(80, "Age must be at most 80."),
  gender: z.enum(['male', 'female'], { required_error: "Please select a gender." }),
  activityLevel: z.coerce.number().min(1.0).max(1.9),
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
    path: ["age"],
});

type CalorieResult = {
  maintenance: number;
  mildLoss: number;
  weightLoss: number;
  extremeLoss: number;
};

const deficitLevels = {
    mild: 250,   // For ~0.25 kg/week loss
    standard: 500, // For ~0.5 kg/week loss
    extreme: 1000, // For ~1 kg/week loss
};

export default function WeightLossCalculator() {
  const [result, setResult] = useState<CalorieResult | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: 'metric',
      gender: 'male',
      age: 25,
      activityLevel: 1.375,
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
    
    let bmr: number;
    if (values.gender === 'male') {
        bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * values.age) + 5;
    } else {
        bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * values.age) - 161;
    }
    
    const maintenanceCalories = Math.round(bmr * values.activityLevel);

    setResult({
        maintenance: maintenanceCalories,
        mildLoss: maintenanceCalories - deficitLevels.mild,
        weightLoss: maintenanceCalories - deficitLevels.standard,
        extremeLoss: maintenanceCalories - deficitLevels.extreme
    });

    try {
      await incrementFeatureCounterAction('weightLoss');
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
      activityLevel: 1.375,
      height_cm: undefined,
      height_ft: undefined,
      height_in: undefined,
      weight_kg: undefined,
      weight_lb: undefined,
    });
    setResult(null);
  }
  
  const ResultRow = ({ label, subLabel, calories, percentage, unit, color }: { label: string, subLabel: string, calories: number, percentage: number, unit: 'metric' | 'imperial', color: string }) => {
    const weightUnit = unit === 'metric' ? 'kg' : 'lb';
    return (
        <div className="flex items-center">
            <div className="flex-1 p-4 bg-muted/50 text-right">
                <p className="font-semibold text-lg">{label}</p>
                <p className="text-sm text-muted-foreground">{subLabel.replace('kg', weightUnit)}</p>
            </div>
            <div className="relative h-full">
                <div className="absolute inset-y-0 left-0 w-4 bg-muted/50 -translate-x-full" style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }} />
            </div>
            <div className={cn("p-4", color)}>
                <p className="font-bold text-2xl">{calories.toLocaleString()}</p>
                <p className="text-sm">Calories/day</p>
            </div>
        </div>
    )
  }

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Enter Your Details</CardTitle>
          <CardDescription>Provide your details to calculate your calorie needs.</CardDescription>
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
                            <RadioGroup onValueChange={(e) => { field.onChange(e); resetForm(); }} defaultValue={field.value} className="flex items-center space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="metric" /></FormControl><FormLabel className="font-normal">Metric (cm, kg)</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="imperial" /></FormControl><FormLabel className="font-normal">Imperial (ft, in, lb)</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              
              <FormField control={form.control} name="age" render={({ field }) => ( <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="e.g. 25" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Ages: 15 - 80</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem className="space-y-3"><FormLabel>Gender</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />

              {unit === 'metric' ? (
                <div className='grid grid-cols-2 gap-4'>
                    <FormField control={form.control} name="height_cm" render={({ field }) => ( <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="180" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="weight_kg" render={({ field }) => ( <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="75" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              ) : (
                <div className='space-y-4'>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="height_ft" render={({ field }) => (<FormItem><FormLabel>Height (ft)</FormLabel><FormControl><Input type="number" placeholder="5" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="height_in" render={({ field }) => (<FormItem><FormLabel>Height (in)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <FormField control={form.control} name="weight_lb" render={({ field }) => (<FormItem><FormLabel>Weight (lb)</FormLabel><FormControl><Input type="number" placeholder="165" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              
               <FormField control={form.control} name="activityLevel" render={({ field }) => ( <FormItem><FormLabel>Activity Level</FormLabel><Select onValueChange={(val) => field.onChange(parseFloat(val))} defaultValue={field.value.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Select your activity level" /></SelectTrigger></FormControl><SelectContent>{activityLevels.map(level => (<SelectItem key={level.name} value={level.value.toString()}>{level.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">Calculate</Button>
                <Button type="button" variant="outline" className="w-full" onClick={resetForm}>Clear</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Daily Calorie Targets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {result ? (
                <div className="space-y-2">
                    <ResultRow label="Maintain weight" subLabel="" calories={result.maintenance} percentage={100} unit={unit} color="bg-green-100 text-green-800" />
                    <ResultRow label="Mild weight loss" subLabel="0.25 kg/week" calories={result.mildLoss} percentage={Math.round(result.mildLoss / result.maintenance * 100)} unit={unit} color="bg-yellow-100 text-yellow-800" />
                    <ResultRow label="Weight loss" subLabel="0.5 kg/week" calories={result.weightLoss} percentage={Math.round(result.weightLoss / result.maintenance * 100)} unit={unit} color="bg-orange-100 text-orange-800" />
                    <ResultRow label="Extreme weight loss" subLabel="1 kg/week" calories={result.extremeLoss} percentage={Math.round(result.extremeLoss / result.maintenance * 100)} unit={unit} color="bg-red-100 text-red-800" />
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-64 flex items-center justify-center">
                    <p>Your calculated calorie targets will appear here.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
