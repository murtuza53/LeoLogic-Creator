
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { incrementFeatureCounterAction } from '@/app/actions';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  height: z.coerce.number().positive("Height must be a positive number.").min(50, "Height must be at least 50 cm.").max(250, "Height cannot exceed 250 cm."),
  weight: z.coerce.number().positive("Weight must be a positive number.").min(10, "Weight must be at least 10 kg.").max(300, "Weight cannot exceed 300 kg."),
  age: z.coerce.number().int().min(2, "Age must be at least 2.").max(120, "Age must be at most 120."),
  gender: z.enum(['male', 'female'], { required_error: "Please select a gender." }),
  unit: z.enum(['metric', 'imperial']).default('metric'),
});

type BmiResult = {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesity';
  healthyWeightRange: { min: number, max: number };
};

const bmiCategories = {
  underweight: { range: [0, 18.5], color: '#ef4444' }, // red
  normal: { range: [18.5, 25], color: '#22c55e' },    // green
  overweight: { range: [25, 30], color: '#eab308' },  // yellow
  obesity: { range: [30, Infinity], color: '#ef4444' }, // red
};

const getCategory = (bmi: number): BmiResult['category'] => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obesity';
};

const getCategoryColor = (category: BmiResult['category']) => {
    switch (category) {
        case 'Underweight': return 'text-red-500';
        case 'Normal': return 'text-green-500';
        case 'Overweight': return 'text-yellow-500';
        case 'Obesity': return 'text-red-500';
    }
}

export default function BmiCalculator() {
  const [result, setResult] = useState<BmiResult | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: 'male',
      unit: 'metric',
      age: 25,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const heightInMeters = values.height / 100;
    const bmi = parseFloat((values.weight / (heightInMeters * heightInMeters)).toFixed(1));
    const category = getCategory(bmi);
    
    // Healthy weight range using BMI of 18.5 and 25
    const minHealthyWeight = 18.5 * (heightInMeters * heightInMeters);
    const maxHealthyWeight = 25 * (heightInMeters * heightInMeters);

    setResult({
      bmi,
      category,
      healthyWeightRange: {
        min: parseFloat(minHealthyWeight.toFixed(1)),
        max: parseFloat(maxHealthyWeight.toFixed(1)),
      }
    });

    try {
      await incrementFeatureCounterAction('bmiCalculator');
      router.refresh();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Counter Error",
        description: "Could not update the global counter.",
      });
    }
  }
  
  const radialData = result ? [
      { name: 'Obesity', value: 45, fill: bmiCategories.obesity.color },
      { name: 'Overweight', value: 30, fill: bmiCategories.overweight.color },
      { name: 'Normal', value: 25, fill: bmiCategories.normal.color },
      { name: 'Underweight', value: 18.5, fill: bmiCategories.underweight.color },
  ] : [];

  const bmiForGauge = result ? Math.min(Math.max(result.bmi, 10), 45) : 0;

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Enter Your Details</CardTitle>
          <CardDescription>Provide your details to calculate your Body Mass Index.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 180" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 75" {...field} />
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
                    <FormControl>
                      <Input type="number" placeholder="e.g. 25" {...field} />
                    </FormControl>
                     <FormDescription>Ages: 2 - 120</FormDescription>
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
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">Male</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="female" />
                          </FormControl>
                          <FormLabel className="font-normal">Female</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                  Calculate
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => { form.reset(); setResult(null); }}>
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg flex flex-col items-center justify-center p-4">
        {result ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-semibold">Your BMI is <span className={cn('font-bold', getCategoryColor(result.category))}>{result.bmi.toFixed(1)} kg/m² ({result.category})</span></h3>
            <div className="w-full h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                 <RadialBarChart 
                    innerRadius="50%" 
                    outerRadius="100%" 
                    data={radialData} 
                    startAngle={180} 
                    endAngle={0}
                    barSize={40}
                  >
                    <PolarAngleAxis type="number" domain={[10, 45]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey='value' angleAxisId={0} data={[{value: 45}]} fill="transparent" />
                </RadialBarChart>
              </ResponsiveContainer>
              <div 
                  className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                  style={{ transform: `rotate(${((bmiForGauge - 10) / 35) * 180 - 90}deg) translateY(-35%)`}}
              >
                  <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-black transform rotate-90" style={{transform: 'rotate(180deg)'}}></div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <p className="text-4xl font-bold">BMI = {result.bmi.toFixed(1)}</p>
              </div>
            </div>
             <ul className="mt-4 text-left list-disc list-inside">
                <li>Healthy BMI range: 18.5 kg/m² - 25 kg/m²</li>
                <li>Healthy weight for the height: {result.healthyWeightRange.min} kg - {result.healthyWeightRange.max} kg</li>
            </ul>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg w-full h-full flex items-center justify-center">
            <p>Your calculated BMI will appear here.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
