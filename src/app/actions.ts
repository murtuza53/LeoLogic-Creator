
'use server';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { generateProductSpecifications } from '@/ai/flows/generate-product-specifications';
import { generateProductImage } from '@/ai/flows/generate-product-image';

export async function generateProductDetails(
  productName: string,
  productImage: string,
  additionalInfo?: string
) {
  try {
    const [descriptionResult, specificationsResult, imageResult] = await Promise.all([
      generateProductDescription({ productName, productImage, additionalInfo }),
      generateProductSpecifications({ productName, productImage, additionalInfo }),
      generateProductImage({ productImage }),
    ]);

    if (!descriptionResult?.description || !specificationsResult?.specifications || !imageResult?.imageUrl) {
      throw new Error('AI failed to generate complete details.');
    }

    return {
      description: descriptionResult.description,
      specifications: specificationsResult.specifications,
      generatedImageUrl: imageResult.imageUrl,
    };
  } catch (error) {
    console.error('Error generating product details:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}
