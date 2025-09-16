
'use server';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { generateProductSpecifications } from '@/ai/flows/generate-product-specifications';

export async function generateProductDetails(
  productName: string,
  productImage: string
) {
  try {
    const [descriptionResult, specificationsResult] = await Promise.all([
      generateProductDescription({ productName, productImage }),
      generateProductSpecifications({ productName, productImage }),
    ]);

    if (!descriptionResult?.description || !specificationsResult?.specifications) {
      throw new Error('AI failed to generate complete details.');
    }

    return {
      description: descriptionResult.description,
      specifications: specificationsResult.specifications,
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
