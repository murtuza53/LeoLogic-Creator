
'use client';

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CBM_FACTORS = {
  cm: 1 / 1000000,
  m: 1,
  in: 1 / 61023.7,
  ft: 1 / 35.3147,
};

const VOLUMETRIC_FACTORS = {
  sea: 1000,
  air: 6000,
};

const CONTAINER_CAPACITIES = {
  '20ft': 33,
  '40ft': 67,
  '40ft-hc': 76,
};

const schema = z.object({
  calculationMode: z.enum(['cbm', 'cft']).default('cbm'),
  unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm'),
  length: z.coerce.number().positive().optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  weightUnit: z.enum(['kg', 'lb']).default('kg'),
  quantity: z.coerce.number().int().min(1).default(1),
});

type FormValues = z.infer<typeof schema>;

const ResultRow = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: React.ReactNode;
}) => (
  <div className="flex items-center justify-between rounded-md border p-3">
    <p className="font-medium">{label}</p>
    <div className="flex items-center gap-2">
      <p className="text-xl font-bold text-primary">{value}</p>
      {unit}
    </div>
  </div>
);

const AdvanceCalculator = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      calculationMode: 'cbm',
      unit: 'cm',
      quantity: 1,
      weightUnit: 'kg',
    },
  });

  const watchedValues = useWatch({ control: form.control });

  const calculations = useMemo(() => {
    const { length, width, height, unit, quantity, weight, weightUnit } =
      watchedValues;

    if (!length || !width || !height) {
      return null;
    }

    const singleVolumeCBM =
      length * width * height * CBM_FACTORS[unit];
    const totalVolumeCBM = singleVolumeCBM * quantity;
    const totalVolumeCFT = totalVolumeCBM * 35.3147;

    const totalWeightKg =
      weight && weightUnit === 'kg'
        ? weight * quantity
        : (weight || 0) * 0.453592 * quantity;
    const totalWeightLb =
      weight && weightUnit === 'lb'
        ? weight * quantity
        : (weight || 0) * 2.20462 * quantity;

    const volWeightSea = (totalVolumeCBM / 1) * VOLUMETRIC_FACTORS.sea;
    const volWeightAir = (totalVolumeCBM * 1000000) / VOLUMETRIC_FACTORS.air;
    
    return {
      totalVolumeCBM: totalVolumeCBM.toFixed(4),
      totalVolumeCFT: totalVolumeCFT.toFixed(4),
      totalWeightKg: totalWeightKg.toFixed(2),
      totalWeightLb: totalWeightLb.toFixed(2),
      volumetricWeightSeaKg: volWeightSea.toFixed(2),
      volumetricWeightSeaLb: (volWeightSea * 2.20462).toFixed(2),
      volumetricWeightAirKg: volWeightAir.toFixed(2),
      volumetricWeightAirLb: (volWeightAir * 2.20462).toFixed(2),
      container20ft: Math.floor(CONTAINER_CAPACITIES['20ft'] / totalVolumeCBM),
      container40ft: Math.floor(CONTAINER_CAPACITIES['40ft'] / totalVolumeCBM),
      container40ftHC: Math.floor(
        CONTAINER_CAPACITIES['40ft-hc'] / totalVolumeCBM
      ),
    };
  }, [watchedValues]);

  return (
    <form className="space-y-6">
      <div className="space-y-4 rounded-md border p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Unit of measurement</Label>
            <Select
              value={form.watch('unit')}
              onValueChange={(value) =>
                form.setValue('unit', value as FormValues['unit'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">cm</SelectItem>
                <SelectItem value="m">m</SelectItem>
                <SelectItem value="in">inch</SelectItem>
                <SelectItem value="ft">feet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" {...form.register('quantity')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Length</Label>
            <Input type="number" {...form.register('length')} />
          </div>
          <div className="space-y-2">
            <Label>Width</Label>
            <Input type="number" {...form.register('width')} />
          </div>
          <div className="space-y-2">
            <Label>Height</Label>
            <Input type="number" {...form.register('height')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Gross Weight (per item)</Label>
          <div className="flex gap-2">
            <Input type="number" {...form.register('weight')} />
            <Select
              value={form.watch('weightUnit')}
              onValueChange={(value) =>
                form.setValue('weightUnit', value as FormValues['weightUnit'])
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kg</SelectItem>
                <SelectItem value="lb">Lb</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {calculations && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ResultRow
              label="Volume (Cubic Meter)"
              value={calculations.totalVolumeCBM}
              unit={
                <span className="font-semibold">
                  m<sup>3</sup>
                </span>
              }
            />
            <ResultRow
              label="Volume (Cubic Feet)"
              value={calculations.totalVolumeCFT}
              unit={
                <span className="font-semibold">
                  ft<sup>3</sup>
                </span>
              }
            />
          </div>
          <ResultRow
            label="Total Weight (Kg)"
            value={calculations.totalWeightKg}
            unit={<span className="text-sm">Kg</span>}
          />
          <ResultRow
            label="Total Weight (lb)"
            value={calculations.totalWeightLb}
            unit={<span className="text-sm">lb</span>}
          />
           <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Volumetric Weight</TableHead>
                    <TableHead className="text-right">Kg</TableHead>
                    <TableHead className="text-right">Lb</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>Sea</TableCell>
                    <TableCell className="text-right">{calculations.volumetricWeightSeaKg}</TableCell>
                    <TableCell className="text-right">{calculations.volumetricWeightSeaLb}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Air</TableCell>
                    <TableCell className="text-right">{calculations.volumetricWeightAirKg}</TableCell>
                    <TableCell className="text-right">{calculations.volumetricWeightAirLb}</TableCell>
                </TableRow>
            </TableBody>
           </Table>

           <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Container Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>20 Feet Container</TableCell>
                    <TableCell className="text-right">{calculations.container20ft}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>40 Feet Container</TableCell>
                    <TableCell className="text-right">{calculations.container40ft}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>40 Feet HC Container</TableCell>
                    <TableCell className="text-right">{calculations.container40ftHC}</TableCell>
                </TableRow>
            </TableBody>
           </Table>
        </div>
      )}
       <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => form.reset()}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
    </form>
  );
};

const BasicCalculator = () => {
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
          calculationMode: 'cbm',
          unit: 'cm',
          quantity: 1,
        },
      });

      const watchedValues = useWatch({ control: form.control });

      const calculations = useMemo(() => {
        const { length, width, height, unit, quantity } = watchedValues;
        if (!length || !width || !height) return null;

        const singleVolumeCBM = length * width * height * CBM_FACTORS[unit];
        const totalVolumeCBM = singleVolumeCBM * quantity;

        return {
            totalVolumeCBM: totalVolumeCBM.toFixed(4)
        }

      }, [watchedValues]);

    return (
        <form className="space-y-6">
             <div className="space-y-4 rounded-md border p-4">
                <div className="space-y-2">
                    <Label>Unit of measurement</Label>
                    <Select
                    value={form.watch('unit')}
                    onValueChange={(value) => form.setValue('unit', value as FormValues['unit'])}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Select unit..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="in">inch</SelectItem>
                        <SelectItem value="ft">feet</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Length</Label>
                        <Input type="number" {...form.register('length')} />
                    </div>
                    <div className="space-y-2">
                        <Label>Width</Label>
                        <Input type="number" {...form.register('width')} />
                    </div>
                    <div className="space-y-2">
                        <Label>Height</Label>
                        <Input type="number" {...form.register('height')} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" {...form.register('quantity')} />
                </div>
            </div>
            {calculations && (
                 <ResultRow
                    label="Total Volume (Cubic Meter)"
                    value={calculations.totalVolumeCBM}
                    unit={<span className="font-semibold">m<sup>3</sup></span>}
                />
            )}
             <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => form.reset()}
            >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
        </form>
    )
}

export default function CbmCalculator() {
  const { isUserLoading } = useUsageLimiter('cbmCalculator'); // Dummy for now
  return (
    <Card className="mt-8 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="advance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="advance">Advance</TabsTrigger>
            <TabsTrigger value="basic">Basic</TabsTrigger>
          </TabsList>
          <TabsContent value="advance" className="mt-6">
            <AdvanceCalculator />
          </TabsContent>
          <TabsContent value="basic" className="mt-6">
            <BasicCalculator />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
