

'use server';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { generateProductSpecifications } from '@/ai/flows/generate-product-specifications';
import { generateProductImage } from '@/ai/flows/generate-product-image';
import { generateAdditionalProductImages } from '@/ai/flows/generate-additional-product-images';
import { solveMathProblem } from '@/ai/flows/solve-math-problem';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { extractTableFromImage } from '@/ai/flows/extract-table-from-image';
import { convertImageToWebp } from '@/ai/flows/convert-image-to-webp';
import { removeBackground } from '@/ai/flows/remove-background';
import { changeBackground } from '@/ai/flows/change-background';
import { resizeAndCropImage } from '@/ai/flows/resize-crop-image';
import { generateLogo } from '@/ai/flows/generate-logo';
import { compressPdf } from '@/ai/flows/compress-pdf';
import { fitnessMentor } from '@/ai/flows/fitness-mentor-flow';
import { incrementCount, getFeatureCountsFromDb, saveContactMessage, ContactMessage } from '@/lib/firebase';
import { PDFDocument } from 'pdf-lib';
import * as ExcelJS from 'exceljs';


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
    
    await incrementFeatureCounterAction('smartProduct');

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
    await incrementFeatureCounterAction('aiMath');
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
    await incrementFeatureCounterAction('ocr');
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

export async function incrementFeatureCounterAction(feature: 'qrGenerator' | 'benefitPay' | 'bmiCalculator' | 'fitnessMentor' | 'splitPdf' | 'bmrCalculator' | 'weightLoss' | 'scientificCalculator' | 'unitConverter') {
  try {
    await incrementCount(feature);
  } catch (error) {
     console.error(`Error incrementing ${feature} counter:`, error);
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
    
    await incrementFeatureCounterAction('mergePdf');

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

export async function extractTableAndGenerateExcelAction(imageDataUri: string) {
  try {
    const result = await extractTableFromImage({ imageDataUri });
    if (!result) {
      throw new Error('AI failed to extract table from the image.');
    }

    if (!result.hasData || result.rows.length === 0) {
      return { excelDataUri: null, message: 'No tabular data was found in the image.' };
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Extracted Data');

    result.rows.forEach((row, rowIndex) => {
      const worksheetRow = worksheet.getRow(rowIndex + 1);
      row.cells.forEach((cell, cellIndex) => {
        const worksheetCell = worksheetRow.getCell(cellIndex + 1);
        worksheetCell.value = cell.value;

        const style: Partial<ExcelJS.Style> = {};
        const font: Partial<ExcelJS.Font> = {};
        const fill: Partial<ExcelJS.Fill> = {};

        if (cell.style?.bold) font.bold = true;
        if (cell.style?.italic) font.italic = true;
        if (cell.style?.textColor) {
          font.color = { argb: cell.style.textColor.replace('#', 'FF') };
        }

        if (cell.style?.backgroundColor) {
          fill.type = 'pattern';
          fill.pattern = 'solid';
          fill.fgColor = { argb: cell.style.backgroundColor.replace('#', 'FF') };
        }

        if (Object.keys(font).length > 0) style.font = font;
        if (fill.type) style.fill = fill;

        worksheetCell.style = style;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const excelDataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${Buffer.from(buffer).toString('base64')}`;

    await incrementFeatureCounterAction('imageExcel');

    return { excelDataUri };
  } catch (error) {
    console.error('Error extracting table from image:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function convertImagesToWebpAction(
  images: { dataUri: string }[]
) {
  try {
    const conversionPromises = images.map(image => 
      convertImageToWebp({
        imageDataUri: image.dataUri,
      })
    );

    const results = await Promise.all(conversionPromises);
    
    await incrementFeatureCounterAction('imageToWebp');
    
    return { convertedImages: results.map(r => r.webpDataUri) };
  } catch (error) {
    console.error('Error converting images to WebP:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during image conversion.',
    };
  }
}


export async function removeBackgroundAction(imageDataUri: string) {
  try {
    const result = await removeBackground({ imageDataUri });
    if (!result) {
      throw new Error('AI failed to remove background from the image.');
    }
    await incrementFeatureCounterAction('imgRemoveBg');
    return result;
  } catch (error) {
    console.error('Error removing background from image:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function changeBackgroundAction(imageDataUri: string, backgroundColor: string) {
  try {
    const result = await changeBackground({ imageDataUri, backgroundColor });
    if (!result) {
      throw new Error('AI failed to change background of the image.');
    }
    await incrementFeatureCounterAction('imgChangeBg');
    return result;
  } catch (error) {
    console.error('Error changing background of image:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function resizeAndCropImageAction(
  images: { dataUri: string }[],
  targetSize: number
) {
  try {
    const promises = images.map(image => 
      resizeAndCropImage({
        imageDataUri: image.dataUri,
        targetSize,
      })
    );

    const results = await Promise.all(promises);
    
    await incrementFeatureCounterAction('resizeCropImage');
    
    return { processedImages: results.map(r => r.imageDataUri) };
  } catch (error) {
    console.error('Error resizing/cropping images:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during image processing.',
    };
  }
}

export async function generateLogoAction(concept: string) {
  try {
    const result = await generateLogo({ concept });
    if (!result?.imageUrls || result.imageUrls.length === 0) {
      throw new Error('AI failed to generate logos.');
    }
    await incrementFeatureCounterAction('logoMaker');
    return result;
  } catch (error) {
    console.error('Error generating logos:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function compressPdfAction(
    pdfDataUri: string,
    compressionLevel: 'low' | 'medium' | 'high'
) {
    try {
        const result = await compressPdf({ pdfDataUri, compressionLevel });
        if (!result) {
            throw new Error('AI failed to compress the PDF.');
        }
        await incrementFeatureCounterAction('pdfCompress');
        return result;
    } catch (error) {
        console.error('Error compressing PDF:', error);
        return {
            error:
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred during PDF compression.',
        };
    }
}

export async function fitnessMentorAction(message: string) {
  try {
    const result = await fitnessMentor({ message });
    if (!result) {
      throw new Error('AI failed to respond.');
    }
    await incrementFeatureCounterAction('fitnessMentor');
    return result;
  } catch (error) {
    console.error('Error with fitness mentor:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function saveContactMessageAction(message: ContactMessage) {
  try {
    await saveContactMessage(message);
    return { success: true };
  } catch (error) {
    console.error('Error saving contact message:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}


export async function getFeatureCounts() {
  return await getFeatureCountsFromDb();
}

    

    
