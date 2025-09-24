
"use client";

import { useState, useEffect } from 'react';
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
  height: z.coerce.number().positive("Height must be a positive number."),
  weight: z.coerce.number().positive("Weight must be a positive number."),
  age: z.coerce.number().int().min(2, "Age must be at least 2.").max(120, "Age must be at most 120."),
  gender: z.enum(['male', 'female'], { required_error: "Please select a gender." }),
  unit: z.enum(['metric', 'imperial']).default('metric'),
}).refine(data => {
    if (data.unit === 'metric') {
        return data.height >= 50 && data.height <= 250 && data.weight >= 10 && data.weight <= 300;
    }
    return true; // Imperial checks can be added if needed, but basic positive check is often enough.
}, {
    message: "Please enter realistic values for height and weight.",
    path: ["height"], // You can decide where to show the error
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
      height: '' as any,
      weight: '' as any,
      gender: 'male',
      unit: 'metric',
      age: 25,
    },
  });
  
  const unit = form.watch('unit');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let heightInMeters: number;
    let weightInKg: number;
    let weightUnit = 'kg';

    if (values.unit === 'imperial') {
      heightInMeters = values.height * 0.0254;
      weightInKg = values.weight * 0.453592;
      weightUnit = 'lbs';
    } else {
      heightInMeters = values.height / 100;
      weightInKg = values.weight;
    }

    const bmi = parseFloat((weightInKg / (heightInMeters * heightInMeters)).toFixed(1));
    const category = getCategory(bmi);
    
    let minHealthyWeight = 18.5 * (heightInMeters * heightInMeters);
    let maxHealthyWeight = 25 * (heightInMeters * heightInMeters);

    if (values.unit === 'imperial') {
        minHealthyWeight = minHealthyWeight / 0.453592; // convert back to lbs
        maxHealthyWeight = maxHealthyWeight / 0.453592; // convert back to lbs
    }

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
  
  const radialData = [
    { name: 'Underweight', value: 18.5, fill: bmiCategories.underweight.color },
    { name: 'Normal', value: 25, fill: bmiCategories.normal.color },
    { name: 'Overweight', value: 30, fill: bmiCategories.obesity.color },
    { name: 'Obesity', value: 45, fill: bmiCategories.obesity.color },
  ];

  const bmiForGauge = result ? Math.min(Math.max(result.bmi, 10), 45) : 0;
  // Convert BMI to angle: (BMI - minBmi) / (maxBmi - minBmi) * 180 degrees
  const angle = result ? ((bmiForGauge - 10) / (35)) * 180 : 0;

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
                    name="unit"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Units</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="metric" />
                                </FormControl>
                                <FormLabel className="font-normal">Metric (cm, kg)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="imperial" />
                                </FormControl>
                                <FormLabel className="font-normal">Imperial (in, lb)</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height ({unit === 'metric' ? 'cm' : 'in'})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={unit === 'metric' ? "e.g. 180" : "e.g. 71"} {...field} />
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
                    <FormLabel>Weight ({unit === 'metric' ? 'kg' : 'lb'})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={unit === 'metric' ? "e.g. 75" : "e.g. 165"} {...field} />
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
                <Button type="button" variant="outline" className="w-full" onClick={() => { form.reset({height: '' as any, weight: '' as any, age: 25, gender: 'male', unit: 'metric' }); setResult(null); }}>
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
                    cx="50%"
                    cy="100%"
                  >
                    <PolarAngleAxis type="number" domain={[10, 45]} tick={false} />
                    <RadialBar
                      background
                      dataKey='value'
                      style={{ transition: 'all 0.5s ease-in-out' }}
                    />
                </RadialBarChart>
              </ResponsiveContainer>
              <div
                className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-0.5 origin-bottom"
                style={{
                  height: '40%', 
                  transform: `rotate(${angle - 90}deg)`,
                  transition: 'transform 0.5s ease-out',
                  backgroundColor: 'hsl(var(--foreground))'
                }}
              >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full" style={{backgroundColor: 'hsl(var(--foreground))'}}></div>
              </div>

              <div className="absolute" style={{bottom: '10%', left: '50%', transform: 'translateX(-50%)'}}>
                <p className="text-4xl font-bold">BMI = {result.bmi.toFixed(1)}</p>
              </div>
            </div>
             <ul className="mt-4 text-left list-disc list-inside">
                <li>Healthy BMI range: 18.5 kg/m² - 25 kg/m²</li>
                <li>Healthy weight for the height: {result.healthyWeightRange.min} {unit === 'metric' ? 'kg' : 'lbs'} - {result.healthyWeightRange.max} {unit === 'metric' ? 'kg' : 'lbs'}</li>
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
