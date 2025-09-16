"use client";

import Image from 'next/image';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { type ProductData } from './product-generator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { Download, PlusCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, ImageRun } from 'docx';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';


type ProductDisplayProps = {
  isLoading: boolean;
  productData: ProductData | null;
  productName: string;
  imagePreview: string | null;
  onProductDataChange: (data: ProductData | null) => void;
};

export default function ProductDisplay({ isLoading, productData, productName, imagePreview, onProductDataChange }: ProductDisplayProps) {
  const displayContentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleSpecChange = (index: number, field: 'name' | 'value', value: string) => {
    if (!productData) return;
    const newSpecifications = [...productData.specifications];
    newSpecifications[index] = { ...newSpecifications[index], [field]: value };
    onProductDataChange({ ...productData, specifications: newSpecifications });
  };

  const addSpecRow = () => {
    if (!productData) return;
    const newSpecifications = [...productData.specifications, { name: '', value: '' }];
    onProductDataChange({ ...productData, specifications: newSpecifications });
  };

  const removeSpecRow = (index: number) => {
    if (!productData) return;
    const newSpecifications = productData.specifications.filter((_, i) => i !== index);
    onProductDataChange({ ...productData, specifications: newSpecifications });
  };

  const handleDownload = async (format: 'json' | 'csv' | 'txt' | 'pdf' | 'docx' | 'html') => {
    if (!productData || !imagePreview) return;

    const dataToDownload = {
      productName,
      ...productData,
    };
    
    const fileName = `${productName.replace(/ /g, '_')}_${new Date().toISOString()}`;

    let content = '';
    let mimeType = '';
    let fileExtension = '';

    if (format === 'json') {
      content = JSON.stringify(dataToDownload, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
      downloadFile(new Blob([content], { type: mimeType }), `${fileName}.${fileExtension}`);
    } else if (format === 'csv') {
      let csv = 'Specification,Value\n';
      dataToDownload.specifications.forEach(spec => {
        csv += `"${spec.name}","${spec.value}"\n`;
      });
      content = csv;
      mimeType = 'text/csv';
      fileExtension = 'csv';
      downloadFile(new Blob([content], { type: mimeType }), `${fileName}.${fileExtension}`);
    } else if (format === 'txt') {
        let txt = `Product: ${productName}\n\n`;
        txt += `Description:\n${dataToDownload.description}\n\n`;
        txt += 'Specifications:\n';
        dataToDownload.specifications.forEach(spec => {
            txt += `- ${spec.name}: ${spec.value}\n`;
        });
        content = txt;
        mimeType = 'text/plain';
        fileExtension = 'txt';
        downloadFile(new Blob([content], { type: mimeType }), `${fileName}.${fileExtension}`);
    } else if (format === 'pdf') {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        const img = new window.Image();
        img.src = imagePreview;
        img.onload = () => {
          const imgWidth = img.width;
          const imgHeight = img.height;
          const aspectRatio = imgWidth / imgHeight;
          
          let newImgWidth = pdfWidth - (margin * 2);
          let newImgHeight = newImgWidth / aspectRatio;

          pdf.addImage(imagePreview, 'PNG', margin, margin, newImgWidth, newImgHeight);
          
          if (displayContentRef.current) {
              html2canvas(displayContentRef.current, {
                onclone: (doc) => {
                    // Hide image from html2canvas render to avoid duplication
                    const imgElement = doc.querySelector<HTMLImageElement>('[data-html2canvas-ignore]');
                    if (imgElement) {
                        imgElement.style.display = 'none';
                    }
                }
              }).then(canvas => {
                const contentImgData = canvas.toDataURL('image/png');
                const contentImgWidth = pdfWidth;
                const contentImgHeight = (canvas.height * contentImgWidth) / canvas.width;
                let contentY = margin + newImgHeight + 10;

                if (contentY + contentImgHeight > pdfHeight) {
                    pdf.addPage();
                    contentY = margin;
                }

                pdf.addImage(contentImgData, 'PNG', 0, contentY, contentImgWidth, contentImgHeight);
                pdf.save(`${fileName}.pdf`);
              });
          }
        }
    } else if (format === 'docx') {
        const response = await fetch(imagePreview);
        const imageBuffer = await response.arrayBuffer();

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: productName, bold: true, size: 32 })],
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: 500,
                                    height: 500 / (imageRef.current ? imageRef.current.naturalWidth / imageRef.current.naturalHeight : 1)
                                }
                            })
                        ]
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [new TextRun({ text: "Product Description", bold: true, size: 24 })],
                    }),
                    new Paragraph({ text: productData.description }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [new TextRun({ text: "Product Specifications", bold: true, size: 24 })],
                    }),
                    new DocxTable({
                        rows: [
                            new DocxTableRow({
                                children: [
                                    new DocxTableCell({ children: [new Paragraph("Specification")], width: { size: 4535, type: WidthType.DXA } }),
                                    new DocxTableCell({ children: [new Paragraph("Value")], width: { size: 4535, type: WidthType.DXA } }),
                                ],
                            }),
                            ...productData.specifications.map(spec => new DocxTableRow({
                                children: [
                                    new DocxTableCell({ children: [new Paragraph(spec.name)] }),
                                    new DocxTableCell({ children: [new Paragraph(spec.value)] }),
                                ],
                            })),
                        ],
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        downloadFile(blob, `${fileName}.docx`);
    } else if (format === 'html') {
        content = `
            <html>
                <head>
                    <title>${productName}</title>
                    <style>
                        body { font-family: sans-serif; }
                        h1 { color: #333; }
                        h2 { color: #555; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>${productName}</h1>
                    <img src="${imagePreview}" alt="${productName}" style="max-width: 100%; height: auto;" />
                    <h2>Product Description</h2>
                    <p>${productData.description.replace(/\n/g, '<br>')}</p>
                    <h2>Product Specifications</h2>
                    <table>
                        <tr><th>Specification</th><th>Value</th></tr>
                        ${productData.specifications.map(spec => `<tr><td>${spec.name}</td><td>${spec.value}</td></tr>`).join('')}
                    </table>
                </body>
            </html>
        `;
        mimeType = 'text/html';
        fileExtension = 'html';
        downloadFile(new Blob([content], { type: mimeType }), `${fileName}.${fileExtension}`);
    }
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadGeneratedImage = async (imageUrl: string, index?: number) => {
    const suffix = typeof index === 'number' ? `_v${index + 1}` : '_1080x1080';
    const fileName = `${productName.replace(/ /g, '_')}${suffix}.png`;
    
    // Convert data URI to Blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    downloadFile(blob, fileName);
  }


  const Placeholder = () => (
    <Card className="flex h-full min-h-[500px] items-center justify-center border-dashed shadow-inner bg-muted/20">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-medium">Your generated content will appear here.</p>
        <p className="text-sm">Fill out the form to get started.</p>
      </div>
    </Card>
  );

  const LoadingState = () => (
    <div className='space-y-4'>
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-6">
          {imagePreview && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image src={imagePreview} alt={productName} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
          )}
          {!imagePreview && <Skeleton className="h-64 w-full rounded-lg" />}
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent>
            <Skeleton className="aspect-square w-full" />
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (!productData || !imagePreview) {
    return <Placeholder />;
  }

  return (
    <div className='space-y-4'>
      <Card className="shadow-lg">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-headline text-3xl">{productName}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload('json')}>Download as JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('csv')}>Download as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('txt')}>Download as TXT</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('pdf')}>Download as PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('docx')}>Download as Word</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('html')}>Download as HTML</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-6">
          <div ref={displayContentRef}>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-card" data-html2canvas-ignore="true">
              <Image
                ref={imageRef}
                src={imagePreview}
                alt={productName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                crossOrigin="anonymous"
               />
            </div>
            <Separator className="my-6" />
            <div>
              <h3 className="font-headline text-xl font-semibold text-foreground">Product Description</h3>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{productData.description}</p>
            </div>
            <Separator className="my-6" />
            <div>
              <h3 className="font-headline text-xl font-semibold text-foreground">Product Specifications</h3>
              <div className="mt-2 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Specification</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productData.specifications.map((spec, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">
                                    <Input
                                        value={spec.name}
                                        onChange={(e) => handleSpecChange(index, 'name', e.target.value)}
                                        className="border-none px-0 focus-visible:ring-0"
                                        placeholder="Name"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={spec.value}
                                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                        className="border-none px-0 focus-visible:ring-0"
                                        placeholder="Value"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeSpecRow(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span className="sr-only">Remove</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={addSpecRow}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Specification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {productData.generatedImageUrl && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-headline text-2xl">Generated Image</CardTitle>
                <Button variant="outline" onClick={() => handleDownloadGeneratedImage(productData.generatedImageUrl!)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download (PNG)
                </Button>
            </CardHeader>
            <CardContent>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                    <Image
                        src={productData.generatedImageUrl}
                        alt={`Generated image of ${productName}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
            </CardContent>
          </Card>
      )}

      {productData.additionalImages && productData.additionalImages.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Additional Generated Images</CardTitle>
            </CardHeader>
            <CardContent>
                <Carousel className="w-full">
                    <CarouselContent>
                        {productData.additionalImages.map((imageUrl, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                <div className="p-1">
                                  <Card>
                                      <CardContent className="relative aspect-square flex items-center justify-center p-6">
                                          <Image
                                            src={imageUrl}
                                            alt={`Additional generated image ${index + 1} of ${productName}`}
                                            fill
                                            className="object-contain rounded-lg"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                          />
                                      </CardContent>
                                      <Button variant="outline" className='w-full' onClick={() => handleDownloadGeneratedImage(imageUrl, index)}>
                                          <Download className="mr-2 h-4 w-4" />
                                          Download Image {index+1}
                                      </Button>
                                  </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </CardContent>
          </Card>
      )}

    </div>
  );
}
