import { NextResponse } from 'next/server';
import { generateProductDetails } from '@/app/actions';
import { z } from 'zod';

const RequestBodySchema = z.object({
  productName: z.string({ required_error: 'productName is required.' }),
  productImage: z.string({ required_error: 'productImage is required.' }).url({ message: "productImage must be a valid data URI."}),
  generateAdditionalImages: z.boolean().default(false),
  additionalInfo: z.string().optional(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = RequestBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { productName, productImage, generateAdditionalImages, additionalInfo } = parsed.data;

  try {
    const result = await generateProductDetails(
      productName,
      productImage,
      generateAdditionalImages,
      additionalInfo
    );

    if (result.error) {
      // The action itself returned an error (e.g., from the AI flow)
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error generating product details:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown internal error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
