
import { NextResponse } from 'next/server';
import { convertToHtml } from '@/ai/flows/convert-to-html';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { source, dataUri, fileName, url } = body;

    let input;
    if (source === 'file') {
      if (!dataUri || !fileName) throw new Error('dataUri and fileName are required for file conversion.');
      input = { source: 'file' as const, dataUri, fileName };
    } else if (source === 'url') {
      if (!url) throw new Error('url is required for URL conversion.');
      input = { source: 'url' as const, url };
    } else {
      throw new Error('Invalid source specified.');
    }

    const result = await convertToHtml(input);
    
    const zipBuffer = Buffer.from(result.zipDataUri.split(',')[1], 'base64');

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="converted.zip"',
      },
    });
  } catch (error) {
    console.error(`Error in /api/html-converter:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
