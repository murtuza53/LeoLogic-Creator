
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { incrementFeatureCounterAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

const conversionFactors = {
  length: {
    meters: 1,
    kilometers: 1000,
    centimeters: 0.01,
    millimeters: 0.001,
    miles: 1609.34,
    yards: 0.9144,
    feet: 0.3048,
    inches: 0.0254,
  },
  mass: {
    kilograms: 1,
    grams: 0.001,
    milligrams: 0.000001,
    pounds: 0.453592,
    ounces: 0.0283495,
  },
  temperature: {
    celsius: { toBase: (c: number) => c, fromBase: (k: number) => k },
    fahrenheit: { toBase: (f: number) => (f - 32) * 5/9, fromBase: (c: number) => c * 9/5 + 32 },
    kelvin: { toBase: (k: number) => k - 273.15, fromBase: (c: number) => c + 273.15 },
  },
};

const unitLabels = {
    meters: "Meters",
    kilometers: "Kilometers",
    centimeters: "Centimeters",
    millimeters: "Millimeters",
    miles: "Miles",
    yards: "Yards",
    feet: "Feet",
    inches: "Inches",
    kilograms: "Kilograms",
    grams: "Grams",
    milligrams: "Milligrams",
    pounds: "Pounds",
    ounces: "Ounces",
    celsius: "Celsius",
    fahrenheit: "Fahrenheit",
    kelvin: "Kelvin",
}

type UnitCategory = keyof typeof conversionFactors;
const categories = Object.keys(conversionFactors) as UnitCategory[];

const formSchema = z.object({
    category: z.string(),
    fromUnit: z.string(),
    toUnit: z.string(),
    fromValue: z.string(),
    toValue: z.string(),
});


export default function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState<string>(Object.keys(conversionFactors.length)[0]);
  const [toUnit, setToUnit] = useState<string>(Object.keys(conversionFactors.length)[1]);
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleFirstUse = useCallback(async () => {
    try {
      await incrementFeatureCounterAction('unitConverter');
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Counter Error",
        description: "Could not update the global counter.",
      });
    }
  }, [router, toast]);
  
  useEffect(() => {
    const onFirstInteraction = () => {
        handleFirstUse();
        window.removeEventListener('click', onFirstInteraction);
        window.removeEventListener('keydown', onFirstInteraction);
    };
    window.addEventListener('click', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });

    return () => {
        window.removeEventListener('click', onFirstInteraction);
        window.removeEventListener('keydown', onFirstInteraction);
    };
  }, [handleFirstUse]);

  const unitsForCategory = useMemo(() => {
    return Object.keys(conversionFactors[activeCategory]);
  }, [activeCategory]);
  
  useEffect(() => {
    setFromUnit(unitsForCategory[0]);
    setToUnit(unitsForCategory[1] || unitsForCategory[0]);
    setFromValue('1');
  }, [unitsForCategory]);

  const convert = useCallback((value: number, from: string, to: string, category: UnitCategory) => {
    if (isNaN(value)) return '';

    if (category === 'temperature') {
      const tempFactors = conversionFactors.temperature;
      const fromKey = from as keyof typeof tempFactors;
      const toKey = to as keyof typeof tempFactors;
      
      if (!tempFactors[fromKey] || !tempFactors[toKey]) return '';

      const baseValue = tempFactors[fromKey].toBase(value);
      const result = tempFactors[toKey].fromBase(baseValue);
      return result.toFixed(4);
    } else {
      const lengthFactors = conversionFactors[category] as Record<string, number>;
      const baseValue = value * lengthFactors[from];
      const result = baseValue / lengthFactors[to];
      return result.toFixed(4);
    }
  }, []);
  
  useEffect(() => {
    const val = parseFloat(fromValue);
    const converted = convert(val, fromUnit, toUnit, activeCategory);
    setToValue(converted);
  }, [fromValue, fromUnit, toUnit, activeCategory, convert]);

  const handleFromValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromValue(e.target.value);
  };
  
  const handleToValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setToValue(e.target.value);
    const converted = convert(val, toUnit, fromUnit, activeCategory);
    setFromValue(converted);
  };

  const swapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);

    const tempValue = fromValue;
    setFromValue(toValue);
    setToValue(tempValue);
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4">
        <Tabs value={activeCategory} onValueChange={(val) => setActiveCategory(val as UnitCategory)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="length">Length</TabsTrigger>
                <TabsTrigger value="mass">Mass</TabsTrigger>
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
            </TabsList>
            {categories.map(category => (
                <TabsContent key={category} value={category}>
                    <div className='flex items-center gap-4 mt-6'>
                        <div className="flex-1 space-y-2">
                             <Select value={fromUnit} onValueChange={setFromUnit}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {unitsForCategory.map(unit => (
                                        <SelectItem key={unit} value={unit}>{(unitLabels as any)[unit]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input type="number" value={fromValue} onChange={handleFromValueChange} className="text-2xl h-14" />
                        </div>

                        <Button variant="ghost" size="icon" onClick={swapUnits} className="mt-8">
                            <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                        </Button>

                        <div className="flex-1 space-y-2">
                            <Select value={toUnit} onValueChange={setToUnit}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {unitsForCategory.map(unit => (
                                        <SelectItem key={unit} value={unit}>{(unitLabels as any)[unit]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Input type="number" value={toValue} onChange={handleToValueChange} className="text-2xl h-14" />
                        </div>
                    </div>
                </TabsContent>
            ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

    

    