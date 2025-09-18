"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import QRCode from "react-qr-code";

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from './ui/slider';
import { Download } from 'lucide-react';

const formSchema = z.object({
  iban: z.string().min(3, {
    message: "Please enter a valid IBAN.",
  }),
  qrColor: z.string(),
  bgColor: z.string(),
  borderSize: z.number().min(0).max(50),
  qrSize: z.number().min(50).max(500),
  borderRadius: z.number().min(0).max(50),
});

export default function QrGenerator() {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [qrConfig, setQrConfig] = useState({
      qrColor: "#000000",
      bgColor: "#FFFFFF",
      borderSize: 10,
      qrSize: 256,
      borderRadius: 8,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      iban: "",
      qrColor: '#000000',
      bgColor: '#FFFFFF',
      borderSize: 10,
      qrSize: 256,
      borderRadius: 8,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const qrData = JSON.stringify({ iban: values.iban, amount: "" });
    setQrValue(qrData);
    setQrConfig({
        qrColor: values.qrColor,
        bgColor: values.bgColor,
        borderSize: values.borderSize,
        qrSize: values.qrSize,
        borderRadius: values.borderRadius,
    });
  }

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "benefit-pay-qr.png";
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };


  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>QR Code Customization</CardTitle>
          <CardDescription>Enter your details and customize the design.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BH62AAAA00000000000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="qrColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QR Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="bgColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="qrSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QR Size: {field.value}px</FormLabel>
                      <FormControl>
                         <Slider
                            min={50}
                            max={500}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="borderSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Border Size: {field.value}px</FormLabel>
                      <FormControl>
                         <Slider
                            min={0}
                            max={50}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="borderRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Border Radius: {field.value}px</FormLabel>
                      <FormControl>
                         <Slider
                            min={0}
                            max={50}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              
              <div className="space-y-2 text-sm text-muted-foreground rounded-lg border border-dashed p-4">
                  <p className="font-semibold">Disclaimer:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>We don&apos;t save your IBAN in our records.</li>
                    <li>Make sure you have entered a valid IBAN.</li>
                    <li>Test the QR code before using it in a real application.</li>
                  </ul>
              </div>

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                Generate QR Code
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg flex flex-col items-center justify-center">
        <CardHeader>
            <CardTitle>Your QR Code</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
            {qrValue ? (
                <div className='flex flex-col items-center gap-4'>
                    <div style={{ background: qrConfig.bgColor, padding: `${qrConfig.borderSize}px`, borderRadius: `${qrConfig.borderRadius}px` }}>
                        <QRCode
                            id="qr-code-svg"
                            value={qrValue}
                            size={qrConfig.qrSize}
                            fgColor={qrConfig.qrColor}
                            bgColor={qrConfig.bgColor}
                            level="L"
                        />
                    </div>
                    <Button onClick={downloadQR} variant="outline">
                        <Download className='mr-2 h-4 w-4' />
                        Download QR
                    </Button>
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>Your generated QR code will appear here.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
