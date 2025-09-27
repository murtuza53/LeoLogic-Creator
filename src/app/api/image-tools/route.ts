
import { NextResponse } from 'next/server';
import { removeBackground } from '@/ai/flows/remove-background';
import { changeBackground } from '@/ai/flows/change-background';
import { convertImageToWebp } from '@/ai/flows/convert-image-to-webp';
import { resizeAndCropImage } from '@/ai/flows/resize-crop-image';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, imageDataUri, images, backgroundColor, targetSize } = body;

    switch (tool) {
      case 'remove-background':
        if (!imageDataUri) throw new Error('imageDataUri is required.');
        const removeBgResult = await removeBackground({ imageDataUri });
        return NextResponse.json(removeBgResult);

      case 'change-background':
        if (!imageDataUri || !backgroundColor) throw new Error('imageDataUri and backgroundColor are required.');
        const changeBgResult = await changeBackground({ imageDataUri, backgroundColor });
        return NextResponse.json(changeBgResult);

      case 'convert-to-webp':
        if (!images || !Array.isArray(images)) throw new Error('images array is required.');
        const conversionPromises = images.map(image => convertImageToWebp({ imageDataUri: image.dataUri }));
        const webpResults = await Promise.all(conversionPromises);
        return NextResponse.json({ convertedImages: webpResults.map(r => r.webpDataUri) });

      case 'resize-crop':
        if (!images || !Array.isArray(images) || !targetSize) throw new Error('images array and targetSize are required.');
        const resizePromises = images.map(image => resizeAndCropImage({ imageDataUri: image.dataUri, targetSize }));
        const resizeResults = await Promise.all(resizePromises);
        return NextResponse.json({ processedImages: resizeResults.map(r => r.imageDataUri) });

      default:
        return NextResponse.json({ error: 'Invalid tool specified.' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Error in /api/image-tools:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
