
'use server';

/**
 * @fileOverview Defines a Genkit flow for converting PDF data to a styled Excel file.
 *
 * It exports:
 * - `convertPdfToExcel`: An async function that takes a PDF data URI and sheet preference.
 * - `ConvertPdfToExcelInput`: The input type for the function.
 * - `ConvertPdfToExcelOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument } from 'pdf-lib';
import * as ExcelJS from 'exceljs';

// Re-using schemas from extract-table-from-image for consistency
const CellStyleSchema = z.object({
  bold: z.boolean().optional().describe('Whether the text is bold.'),
  italic: z.boolean().optional().describe('Whether the text is italic.'),
  textColor: z.string().optional().describe('The hex color of the text (e.g., #FF0000).'),
  backgroundColor: z.string().optional().describe('The hex color of the cell background (e.g., #00FF00).'),
});

const CellSchema = z.object({
  value: z.string().describe('The text content of the cell.'),
  style: CellStyleSchema.optional().describe('The styling of the cell.'),
});

const RowSchema = z.object({
  cells: z.array(CellSchema).describe('The cells in this row.'),
});

const PageDataSchema = z.object({
  hasData: z.boolean().describe('Whether any tabular data was found on this page.'),
  rows: z.array(RowSchema).describe('The rows of data extracted from the table on this page.'),
});
// End of re-used schemas

const ConvertPdfToExcelInputSchema = z.object({
  pdfDataUri: z.string().describe("A PDF file to be converted, as a data URI."),
  sheetOption: z.enum(['single', 'multiple']).describe('Option for Excel sheet generation.'),
});
export type ConvertPdfToExcelInput = z.infer<typeof ConvertPdfToExcelInputSchema>;

const ConvertPdfToExcelOutputSchema = z.object({
  excelDataUri: z.string().describe('The generated Excel file as a data URI.'),
});
export type ConvertPdfToExcelOutput = z.infer<typeof ConvertPdfToExcelOutputSchema>;


const extractStyledTableFromPagePrompt = ai.definePrompt({
    name: 'extractStyledTableFromPagePrompt',
    input: { schema: z.object({ pageImage: z.string() }) },
    output: { schema: PageDataSchema },
    prompt: `You are an expert data entry specialist. Analyze the provided image of a PDF page, identify any tables, and extract the data with perfect fidelity, including styling.

  **Instructions:**
  
  1.  **Table Detection:** If no table is found, set 'hasData' to false and return an empty 'rows' array.
  2.  **Data Extraction:** Extract text from each cell, maintaining row and column structure.
  3.  **Style Preservation:** For each cell, detect bold/italic text, text color, and background color, providing them as hex codes.
  4.  **Output Formatting:** Structure the output according to the JSON schema, with each object in 'rows' representing a table row.
  
  Image to process: {{media url=pageImage}}`,
});


export async function convertPdfToExcel(input: ConvertPdfToExcelInput): Promise<ConvertPdfToExcelOutput> {
  return convertPdfToExcelFlow(input);
}

const convertPdfToExcelFlow = ai.defineFlow(
  {
    name: 'convertPdfToExcelFlow',
    inputSchema: ConvertPdfToExcelInputSchema,
    outputSchema: ConvertPdfToExcelOutputSchema,
  },
  async ({ pdfDataUri, sheetOption }) => {
    const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const workbook = new ExcelJS.Workbook();
    
    let singleWorksheet: ExcelJS.Worksheet | undefined;
    if (sheetOption === 'single') {
        singleWorksheet = workbook.addWorksheet('All Pages');
    }

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        
        // This is a simplified approach to render a page to an image.
        // A real implementation would need a library like pdf-js to render the page to a canvas, then get a data URI.
        // For this AI flow, we'll ask the model to process the PDF page directly.
        // As a proxy, we'll create a temporary PDF with just one page to send to the model.
        
        const tempPdf = await PDFDocument.create();
        const [copiedPage] = await tempPdf.copyPages(pdfDoc, [i]);
        tempPdf.addPage(copiedPage);
        const tempPdfBytes = await tempPdf.save();
        const pageImageUri = `data:application/pdf;base64,${Buffer.from(tempPdfBytes).toString('base64')}`;

        const { output: pageData } = await extractStyledTableFromPagePrompt({ pageImage: pageImageUri });

        if (!pageData || !pageData.hasData || pageData.rows.length === 0) {
            continue; // Skip pages with no tables
        }
        
        let currentWorksheet: ExcelJS.Worksheet;
        if (sheetOption === 'multiple') {
            currentWorksheet = workbook.addWorksheet(`Page ${i + 1}`);
        } else {
            currentWorksheet = singleWorksheet!;
            // Add a separator row if this is not the first page with data being added
            if (currentWorksheet.actualRowCount > 0) {
                 currentWorksheet.addRow([]); // Add a blank row as a separator
                 const headerRow = currentWorksheet.addRow([`Data from Page ${i+1}`]);
                 headerRow.font = { bold: true, size: 14 };
                 currentWorksheet.mergeCells(headerRow.number, 1, headerRow.number, 5);
                 currentWorksheet.addRow([]); // Add another blank row
            }
        }
        
        // Apply data and styles to the worksheet
        pageData.rows.forEach(row => {
            const worksheetRow = currentWorksheet.addRow(row.cells.map(cell => cell.value));
            worksheetRow.eachCell((worksheetCell, colNumber) => {
                const cell = row.cells[colNumber - 1];
                if (cell?.style) {
                    const style: Partial<ExcelJS.Style> = {};
                    const font: Partial<ExcelJS.Font> = {};
                    const fill: Partial<ExcelJS.Fill> = {};

                    if (cell.style.bold) font.bold = true;
                    if (cell.style.italic) font.italic = true;
                    if (cell.style.textColor) font.color = { argb: cell.style.textColor.replace('#', '') };

                    if (cell.style.backgroundColor) {
                        fill.type = 'pattern';
                        fill.pattern = 'solid';
                        fill.fgColor = { argb: cell.style.backgroundColor.replace('#', '') };
                    }
                    
                    if (Object.keys(font).length > 0) style.font = font;
                    if (fill.type) style.fill = fill;
                    worksheetCell.style = style;
                }
            });
        });
    }
    
    // Create the Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const excelDataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${Buffer.from(buffer).toString('base64')}`;
    
    return { excelDataUri };
  }
);

    