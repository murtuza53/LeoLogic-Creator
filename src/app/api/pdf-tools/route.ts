
import { NextResponse } from 'next/server';
import { compressPdf } from '@/ai/flows/compress-pdf';
import { PDFDocument } from 'pdf-lib';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

async function mergePdfs(pdfDataUris: string[]) {
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
    
    return { mergedPdf: mergedPdfDataUri };
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, pdfDataUri, compressionLevel, pdfDataUris } = body;

    switch (tool) {
      case 'compress-pdf':
        if (!pdfDataUri || !compressionLevel) {
          throw new Error('pdfDataUri and compressionLevel are required.');
        }
        const compressResult = await compressPdf({ pdfDataUri, compressionLevel });
        return NextResponse.json(compressResult);
      
      case 'merge-pdf':
        if (!pdfDataUris || !Array.isArray(pdfDataUris)) {
            throw new Error('pdfDataUris array is required.');
        }
        const mergeResult = await mergePdfs(pdfDataUris);
        return NextResponse.json(mergeResult);

      default:
        return NextResponse.json({ error: 'Invalid tool specified.' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Error in /api/pdf-tools:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
