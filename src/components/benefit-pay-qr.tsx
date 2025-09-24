"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import QRCode from "react-qr-code";
import html2canvas from 'html2canvas';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { incrementQrCodeCounterAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  cr: z.string().min(1, "CR is required."),
  amount: z.string().min(1, "Amount is required."),
  reference: z.string().optional(),
});

export default function BenefitPayQr() {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cr: "",
      amount: "",
      reference: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // BenefitPay URL scheme: https://www.benefit.bh/benefitpay/cr/{CR}/{AMOUNT}/{REFERENCE}
    const baseUrl = "https://www.benefit.bh/benefitpay/cr/";
    let url = `${baseUrl}${values.cr}/${values.amount}`;
    if (values.reference) {
      url += `/${values.reference}`;
    }
    setQrValue(url);
    
    const result = await incrementQrCodeCounterAction('benefitPay');
    if (result?.error) {
      toast({
        variant: "destructive",
        title: "Counter Error",
        description: "Could not update the global counter.",
      });
    } else {
      router.refresh();
    }
  }

  const downloadQR = () => {
    const qrCodeElement = document.getElementById('qr-code-svg-wrapper');
    if (!qrCodeElement) return;

    html2canvas(qrCodeElement).then(canvas => {
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'benefit-pay-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    });
  };

  return (
    <>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Enter the details for the Benefit Pay transaction.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CR / Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (BHD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10.500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Invoice #123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                  Generate QR Code
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg flex flex-col items-center justify-center">
          <CardHeader>
              <CardTitle>Benefit Pay QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-4 w-full">
              {qrValue ? (
                  <div className='flex flex-col items-center gap-4 w-full'>
                      <div id="qr-code-svg-wrapper" className="p-4 bg-white rounded-lg">
                          <QRCode
                              id="qr-code-svg"
                              value={qrValue}
                              size={256}
                              className="h-auto w-full max-w-[300px]"
                          />
                      </div>
                      <Button onClick={downloadQR} variant="outline" className="mt-4">
                          <Download className='mr-2 h-4 w-4' />
                          Download PNG
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
    </>
  );
}

    