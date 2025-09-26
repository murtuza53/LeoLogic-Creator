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
import { Slider } from './ui/slider';
import { Download } from 'lucide-react';
import { Switch } from './ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

const formSchema = z.object({
  iban: z.string().min(1, "IBAN is required.").max(34, "IBAN cannot exceed 34 characters."),
  qrColor: z.string(),
  bgColor: z.string(),
  transparentBg: z.boolean(),
  borderSize: z.number().min(0).max(50),
  qrSize: z.number().min(50).max(1000),
  borderRadius: z.number().min(0).max(50),
});

export default function BenefitPayQr() {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('benefitPay');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      iban: "",
      qrColor: '#000000',
      bgColor: '#FFFFFF',
      transparentBg: false,
      borderSize: 20,
      qrSize: 256,
      borderRadius: 8,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isUserLoading) {
      toast({ description: "Verifying user status..."});
      return;
    }
    if (!checkLimit()) return;

    const qrJson = {
      iban: values.iban,
      amount: ""
    };
    setQrValue(JSON.stringify(qrJson));
    incrementUsage();
  }

  const downloadQR = () => {
    const qrCodeElement = document.getElementById('qr-code-svg-wrapper');
    if (!qrCodeElement) return;

     html2canvas(qrCodeElement, {
      backgroundColor: null, // This is key for transparent backgrounds
      scale: form.getValues('qrSize') / qrCodeElement.offsetWidth,
    }).then(canvas => {
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'benefit-pay-iban-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    });
  };

  const isBgTransparent = form.watch('transparentBg');

  return (
    <>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Benefit Pay Customization</CardTitle>
            <CardDescription>Enter your IBAN and customize the QR code design.</CardDescription>
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
                        <Input placeholder="SA03 8000 0000 6080 1016 7519" {...field} />
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
                          <Input type="color" {...field} className="h-10 p-1"/>
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
                          <Input type="color" {...field} className="h-10 p-1" disabled={isBgTransparent}/>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="transparentBg"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Transparent Background</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="qrSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>QR Size (for download): {field.value}px</FormLabel>
                        <FormControl>
                          <Slider
                              min={50}
                              max={1000}
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
                        <FormLabel>Padding: {field.value}px</FormLabel>
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

                <div className="space-y-2">
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
                    Generate QR Code
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Test QR Code before using it
                  </p>
                </div>
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
                      <div 
                        id="qr-code-svg-wrapper"
                        style={{ 
                            background: form.watch('transparentBg') ? 'transparent' : form.watch('bgColor'),
                            padding: `${form.watch('borderSize')}px`, 
                            borderRadius: `${form.watch('borderRadius')}px`,
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto',
                        }}
                        className={form.watch('transparentBg') ? "bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23F3F4F6%22/%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22/%3E%3C/svg%3E')]" : ""}
                      >
                          <QRCode
                              id="qr-code-svg"
                              value={qrValue}
                              size={256} // This is just the base size for display, download size is handled separately
                              fgColor={form.watch('qrColor')}
                              bgColor={"transparent"}
                              level="L"
                              className="h-auto w-full max-w-[300px]"
                          />
                      </div>
                      <Button onClick={downloadQR} variant="outline" className="mt-4">
                          <Download className='mr-2 h-4 w-4' />
                          Download PNG ({form.watch('qrSize')}px)
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
