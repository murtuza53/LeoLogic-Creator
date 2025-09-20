
'use server';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { generateProductSpecifications } from '@/ai/flows/generate-product-specifications';
import { generateProductImage } from '@/ai/flows/generate-product-image';
import { generateAdditionalProductImages } from '@/ai/flows/generate-additional-product-images';
import { solveMathProblem } from '@/ai/flows/solve-math-problem';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { incrementCount, getFeatureCountsFromDb } from '@/lib/firebase';
import { PDFDocument } from 'pdf-lib';
import 'canvas';


export async function generateProductDetails(
  productName: string,
  productImage: string,
  generateAdditionalImages: boolean,
  additionalInfo?: string
) {
  try {
    const promises = [
      generateProductDescription({ productName, productImage, additionalInfo }),
      generateProductSpecifications({ productName, productImage, additionalInfo }),
      generateProductImage({ productImage }),
    ];

    if (generateAdditionalImages) {
      promises.push(generateAdditionalProductImages({productName, productImage, additionalInfo}));
    }

    const results = await Promise.all(promises);

    const descriptionResult = results[0];
    const specificationsResult = results[1];
    const imageResult = results[2];
    const additionalImagesResult = generateAdditionalImages ? results[3] : { imageUrls: [] };


    if (!descriptionResult?.description || !specificationsResult?.specifications || !imageResult?.imageUrl) {
      throw new Error('AI failed to generate complete details.');
    }
    
    await incrementCount('product');

    return {
      description: descriptionResult.description,
      specifications: specificationsResult.specifications,
      generatedImageUrl: imageResult.imageUrl,
      additionalImages: (additionalImagesResult as any).imageUrls || [],
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

export async function solveMathProblemAction(problem: string) {
  try {
    const result = await solveMathProblem({ problem });
    if (!result) {
      throw new Error('AI failed to solve the problem.');
    }
    await incrementCount('math');
    return result;
  } catch (error) {
    console.error('Error solving math problem:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function extractTextFromImageAction(imageDataUri: string) {
  try {
    const result = await extractTextFromImage({ imageDataUri });
    if (!result) {
      throw new Error('AI failed to extract text from the image.');
    }
    await incrementCount('ocr');
    return result;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function incrementQrCodeCounterAction() {
  try {
    await incrementCount('qr');
  } catch (error) {
     console.error('Error incrementing QR code counter:', error);
     return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function mergePdfsAction(pdfDataUris: string[]) {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const dataUri of pdfDataUris) {
      const pdfBytes = Buffer.from(dataUri.split(',')[1], 'base64');
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedPdfDataUri = `data:application/pdf;base64,${Buffer.from(
      mergedPdfBytes
    ).toString('base64')}`;
    
    await incrementCount('pdf');

    return { mergedPdf: mergedPdfDataUri };
  } catch (error) {
    console.error('Error merging PDFs:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while merging PDFs.',
    };
  }
}

export async function extractImagesFromPdfAction(pdfDataUri: string) {
    try {
        const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const imageObjects = pdfDoc.context.indirectObjects.values();
        
        const images: string[] = [];
        for (const ref of imageObjects) {
            const maybeImage = ref.as(Object);
            if (
                maybeImage instanceof Map &&
                maybeImage.get('Subtype')?.toString() === '/Image'
            ) {
                const image = await pdfDoc.embedJpg(ref.toString());
                const dataUri = await image.asDataUri();
                images.push(dataUri);
            }
        }
        
        if (images.length === 0) {
            return { images: [] };
        }

        await incrementCount('pdfImages');

        return { images };
    } catch (error) {
        console.error('Error extracting images from PDF:', error);
        return {
            error:
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred while extracting images from the PDF.',
        };
    }
}


export async function getFeatureCounts() {
  return await getFeatureCountsFromDb();
}