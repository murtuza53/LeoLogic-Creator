
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
import { cn } from '@/lib/utils';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

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
    return true;
}, {
    message: "Please enter realistic values for height and weight.",
    path: ["height"],
});


type BmiResult = {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesity';
  healthyWeightRange: { min: number, max: number };
};

const getCategory = (bmi: number): BmiResult['category'] => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obesity';
};

const getCategoryStyle = (category: BmiResult['category']) => {
    switch (category) {
        case 'Underweight': return { card: 'bg-blue-50 border-blue-200', text: 'text-blue-600', scale: 'bg-blue-400' };
        case 'Normal': return { card: 'bg-green-50 border-green-200', text: 'text-green-600', scale: 'bg-green-500' };
        case 'Overweight': return { card: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-600', scale: 'bg-yellow-500' };
        case 'Obesity': return { card: 'bg-red-50 border-red-200', text: 'text-red-600', scale: 'bg-red-500' };
    }
}

const BMI_SCALE = { min: 15, max: 40 };

const getPositionOnScale = (bmi: number) => {
    const clampedBmi = Math.max(BMI_SCALE.min, Math.min(bmi, BMI_SCALE.max));
    const percentage = ((clampedBmi - BMI_SCALE.min) / (BMI_SCALE.max - BMI_SCALE.min)) * 100;
    return Math.max(0, Math.min(100, percentage));
};


export default function BmiCalculator() {
  const [result, setResult] = useState<BmiResult | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('bmiCalculator');

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
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;
    incrementUsage();

    let heightInMeters: number;
    let weightInKg: number;

    if (values.unit === 'imperial') {
      heightInMeters = values.height * 0.0254;
      weightInKg = values.weight * 0.453592;
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

  }

  const categoryStyles = result ? getCategoryStyle(result.category) : null;
  const pointerPosition = result ? getPositionOnScale(result.bmi) : 0;

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
                            onValueChange={(e) => {
                                field.onChange(e);
                                form.setValue('height', '' as any);
                                form.setValue('weight', '' as any);
                                setResult(null);
                            }}
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
                      <Input type="number" placeholder={unit === 'metric' ? "e.g. 180" : "e.g. 71"} {...field} value={field.value ?? ''} />
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
                      <Input type="number" placeholder={unit === 'metric' ? "e.g. 75" : "e.g. 165"} {...field} value={field.value ?? ''}/>
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
      
      <Card className="shadow-lg flex flex-col items-center justify-center p-6 transition-colors duration-500">
        {result && categoryStyles ? (
            <div className={cn("w-full h-full flex flex-col items-center justify-center text-center space-y-6 p-6 rounded-lg transition-colors duration-300", categoryStyles.card)}>
                <div className="w-full max-w-sm">
                    <div className="relative mb-2">
                        <div className="absolute top-0 h-3 w-3 -translate-y-4 -translate-x-1/2 rounded-full transition-all duration-500 ease-out" style={{ left: `${pointerPosition}%`, backgroundColor: 'hsl(var(--foreground))' }}>
                            <div className="absolute top-full left-1/2 h-2 w-0 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent" style={{borderTopColor: 'hsl(var(--foreground))'}}/>
                        </div>
                        <div className="flex h-3 w-full rounded-full overflow-hidden">
                           <div className="w-[14%] bg-blue-300" />
                           <div className="w-[26%] bg-green-400" />
                           <div className="w-[20%] bg-yellow-400" />
                           <div className="w-[40%] bg-red-400" />
                        </div>
                         <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>15</span>
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                            <span>40</span>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col items-center'>
                    <p className="text-sm text-muted-foreground">Your BMI is</p>
                    <p className={cn("text-6xl font-bold", categoryStyles.text)}>
                        {result.bmi.toFixed(1)}
                    </p>
                    <p className={cn("text-xl font-semibold", categoryStyles.text)}>
                        {result.category}
                    </p>
                </div>
                
                <div className="text-center bg-background/50 p-4 rounded-lg">
                     <p className='text-sm font-medium'>Healthy weight for your height:</p>
                     <p className='text-lg font-bold text-foreground'>{result.healthyWeightRange.min} {unit === 'metric' ? 'kg' : 'lbs'} - {result.healthyWeightRange.max} {unit === 'metric' ? 'kg' : 'lbs'}</p>
                     <p className='text-xs text-muted-foreground mt-1'>Healthy BMI range: 18.5 - 25</p>
                </div>
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

    