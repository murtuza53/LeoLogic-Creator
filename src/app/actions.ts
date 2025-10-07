
'use server';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { generateProductSpecifications } from '@/ai/flows/generate-product-specifications';
import { generateProductImage } from '@/ai/flows/generate-product-image';
import { generateAdditionalProductImages } from '@/ai/flows/generate-additional-product-images';
import { solveMathProblem } from '@/ai/flows/solve-math-problem';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { extractTableFromImage } from '@/ai/flows/extract-table-from-image';
import { generateIcon } from '@/ai/flows/generate-icon';
import { fitnessMentor } from '@/ai/flows/fitness-mentor-flow';
import { analyzeText } from '@/ai/flows/analyze-text';
import { saveContactMessage, createUserProfile } from '@/lib/firebase';
import type { ContactMessage } from '@/lib/types';
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

export async function generateIconAction(concept: string, image?: string) {
  try {
    const result = await generateIcon({ concept, image });
    if (!result?.imageUrls || result.imageUrls.length === 0) {
      throw new Error('AI failed to generate icons.');
    }
    return result;
  } catch (error) {
    console.error('Error generating icons:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function fitnessMentorAction(message: string) {
  try {
    const result = await fitnessMentor({ message });
    if (!result) {
      throw new Error('AI failed to respond.');
    }
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

export async function createUserProfileAction(userId: string, data: { name: string, email: string }) {
  try {
    await createUserProfile(userId, data);
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}

export async function analyzeTextAction(text: string) {
  try {
    const result = await analyzeText({ text });
    if (!result) {
      throw new Error('AI failed to analyze the text.');
    }
    return result;
  } catch (error) {
    console.error('Error analyzing text:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred.',
    };
  }
}
