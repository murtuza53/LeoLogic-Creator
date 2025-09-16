"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { type ProductData } from './product-generator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

type ProductDisplayProps = {
  isLoading: boolean;
  productData: ProductData | null;
  productName: string;
  imagePreview: string | null;
  onProductDataChange: (data: ProductData | null) => void;
};

export default function ProductDisplay({ isLoading, productData, productName, imagePreview, onProductDataChange }: ProductDisplayProps) {
  const handleSpecChange = (index: number, field: 'name' | 'value', value: string) => {
    if (!productData) return;
    const newSpecifications = [...productData.specifications];
    newSpecifications[index] = { ...newSpecifications[index], [field]: value };
    onProductDataChange({ ...productData, specifications: newSpecifications });
  };

  const addSpecRow = () => {
    if (!productData) return;
    const newSpecifications = [...productData.specifications, { name: '', value: '' }];
    onProductDataChange({ ...productData, specifications: newSpecifications });
  };

  const removeSpecRow = (index: number) => {
    if (!productData) return;
    const newSpecifications = productData.specifications.filter((_, i) => i !== index);
    onProductDataChange({ ...productData, specifications: newSpecifications });
  };


  const Placeholder = () => (
    <Card className="flex h-full min-h-[500px] items-center justify-center border-dashed shadow-inner bg-muted/20">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-medium">Your generated content will appear here.</p>
        <p className="text-sm">Fill out the form to get started.</p>
      </div>
    </Card>
  );

  const LoadingState = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-6">
        {imagePreview && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image src={imagePreview} alt={productName} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
        )}
        {!imagePreview && <Skeleton className="h-64 w-full rounded-lg" />}
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/4 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/4 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (!productData || !imagePreview) {
    return <Placeholder />;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{productName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-card">
          <Image src={imagePreview} alt={productName} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <Separator />
        <div>
          <h3 className="font-headline text-xl font-semibold text-foreground">Product Description</h3>
          <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{productData.description}</p>
        </div>
        <Separator />
        <div>
          <h3 className="font-headline text-xl font-semibold text-foreground">Product Specifications</h3>
          <div className="mt-2 rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Specification</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productData.specifications.map((spec, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">
                                <Input
                                    value={spec.name}
                                    onChange={(e) => handleSpecChange(index, 'name', e.target.value)}
                                    className="border-none px-0 focus-visible:ring-0"
                                    placeholder="Name"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    value={spec.value}
                                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                    className="border-none px-0 focus-visible:ring-0"
                                    placeholder="Value"
                                />
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeSpecRow(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Remove</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={addSpecRow}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Specification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
