"use client";

import { useState } from 'react';
import ProductForm from '@/components/product-form';
import ProductDisplay from '@/components/product-display';
import { generateProductDetails } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export type ProductData = {
  description: string;
  specifications: { name: string; value: string; }[];
  generatedImageUrl?: string;
  additionalImages?: string[];
};

export default function ProductGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [productName, setProductName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (name: string, imageFile: File, generateAdditionalImages: boolean, additionalInfo?: string) => {
    setIsLoading(true);
    setProductData(null);
    setProductName(name);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const imagePreviewUrl = URL.createObjectURL(imageFile);
    setImagePreview(imagePreviewUrl);

    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      try {
        const result = await generateProductDetails(name, base64Image, generateAdditionalImages, additionalInfo);
        if ('error' in result) {
          throw new Error(result.error);
        }
        setProductData(result as ProductData);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: "There was an issue generating product details. Please try again.",
        });
        setImagePreview(null);
        setProductName('');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
       toast({
          variant: "destructive",
          title: "Image Read Failed",
          description: "Could not read the selected image file.",
       });
       setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 grid gap-12 md:grid-cols-2 md:gap-8 lg:mt-12">
      <ProductForm onGenerate={handleGenerate} isLoading={isLoading} />
      <ProductDisplay
        isLoading={isLoading}
        productData={productData}
        productName={productName}
        imagePreview={imagePreview}
        onProductDataChange={setProductData}
      />
    </div>
  );
}
