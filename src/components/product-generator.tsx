
"use client";

import { useState } from 'react';
import ProductForm from '@/components/product-form';
import ProductDisplay from '@/components/product-display';
import { generateProductDetails } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

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
  const router = useRouter();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('smartProduct');

  const getBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleGenerate = async (name: string, imageFile: File, generateAdditionalImages: boolean, additionalInfo?: string) => {
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }

    if (!checkLimit()) {
      return; // Stop if limit is reached
    }

    setIsLoading(true);
    setProductData(null);
    setProductName(name);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const imagePreviewUrl = URL.createObjectURL(imageFile);
    setImagePreview(imagePreviewUrl);

    try {
      const base64Image = await getBase64(imageFile);
      const result = await generateProductDetails(name, base64Image, generateAdditionalImages, additionalInfo);
      if ('error' in result) {
        throw new Error(result.error);
      }
      setProductData(result as ProductData);
      incrementUsage(); // Increment usage only on success
      router.refresh();
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

  return (
    <>
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
    </>
  );
}

    