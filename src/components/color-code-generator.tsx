
'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  UploadCloud,
  Palette,
  Clipboard,
  ClipboardCheck,
  LoaderCircle,
  WandSparkles,
  RefreshCcw,
} from 'lucide-react';
import Image from 'next/image';
import { extractColorsFromImage } from '@/ai/flows/extract-colors-from-image';
import { useRouter } from 'next/navigation';

// Color conversion utilities
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (60 <= h && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (120 <= h && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (180 <= h && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (240 <= h && h < 300) {
    [r, g, b] = [x, 0, c];
  } else if (300 <= h && h < 360) {
    [r, g, b] = [c, 0, x];
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const ColorDisplay = ({ color }: { color: string }) => {
  const { toast } = useToast();
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedValue(text);
      toast({ title: `Copied "${text}"` });
      setTimeout(() => setCopiedValue(null), 2000);
    });
  };

  const values = [
    { label: 'HEX', value: color },
    { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
  ];

  return (
    <div className="space-y-2">
      {values.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <Label className="w-12 text-sm text-muted-foreground">{label}</Label>
          <Input readOnly value={value} className="font-mono text-sm" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => copyToClipboard(value)}
          >
            {copiedValue === value ? (
              <ClipboardCheck className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default function ColorCodeGenerator() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for image palette tab
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<string[]>([]);

  // State for color picker and manual input tabs
  const [hex, setHex] = useState('#1a4175');
  const [rgb, setRgb] = useState({ r: 26, g: 65, b: 117 });
  const [hsl, setHsl] = useState({ h: 211, s: 63, l: 28 });

  const handleColorChange = (newColor: string, source: 'hex' | 'picker') => {
    setHex(newColor);
    const newRgb = hexToRgb(newColor);
    setRgb(newRgb);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleRgbChange = (newRgb: { r: number; g: number; b: number }) => {
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHex(newHex);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (newHsl: { h: number; s: number; l: number }) => {
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageProcess = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 1MB.',
        });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only image files are accepted.',
        });
        return;
      }

      setIsLoading(true);
      setColorPalette([]);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      const imagePreviewUrl = URL.createObjectURL(file);
      setImagePreview(imagePreviewUrl);

      try {
        const base64Image = await getBase64(file);
        const result = await extractColorsFromImage({ imageDataUri: base64Image });
        if (result.colors) {
          setColorPalette(result.colors);
          toast({ title: 'Palette Extracted!', description: 'Your color palette is ready.' });
        } else {
          throw new Error('Could not extract colors.');
        }
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: 'There was an issue extracting colors from the image.',
        });
        setImagePreview(null);
      } finally {
        setIsLoading(false);
      }
    },
    [toast, imagePreview, router]
  );
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleImageProcess(file);
  };
  
  const resetImageTab = () => {
    setIsLoading(false);
    if(imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setColorPalette([]);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mt-8">
      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">Image Palette</TabsTrigger>
          <TabsTrigger value="picker">Color Picker</TabsTrigger>
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
        </TabsList>

        {/* Image Palette Tab */}
        <TabsContent value="image">
          <Card className="mt-4 shadow-lg">
            <CardHeader>
              <CardTitle>Extract Colors From Image</CardTitle>
              <CardDescription>
                Upload an image to generate a color palette.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <div
                    className="relative flex justify-center rounded-lg border-2 border-dashed border-input px-6 py-10 hover:border-primary/50 transition-colors cursor-pointer shadow-inner"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 font-semibold text-primary">
                        Upload an image
                      </p>
                      <p className="text-sm leading-5 text-muted-foreground/80">
                        PNG, JPG, WEBP (Max 1MB)
                      </p>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        ref={fileInputRef}
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                  {imagePreview && (
                    <Button variant="outline" className='w-full mt-4' onClick={resetImageTab}><RefreshCcw className='mr-2' />Clear</Button>
                  )}
                </div>
                <div className='space-y-4'>
                    {imagePreview && (
                         <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                            <Image src={imagePreview} alt="Image preview" fill className="object-contain" />
                        </div>
                    )}
                    {isLoading && <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />}
                    {colorPalette.length > 0 && !isLoading && (
                        <div className="grid grid-cols-1 gap-2">
                            {colorPalette.map((color, index) => (
                                <Card key={index}>
                                    <CardContent className="p-3 flex items-center gap-4">
                                        <div style={{ backgroundColor: color }} className="h-10 w-10 rounded-md border" />
                                        <div className='flex-1'>
                                            <ColorDisplay color={color} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Color Picker Tab */}
        <TabsContent value="picker">
          <Card className="mt-4 shadow-lg">
            <CardHeader>
              <CardTitle>Choose a Color</CardTitle>
              <CardDescription>
                Use the color picker to select a color and get its codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <Input
                  type="color"
                  value={hex}
                  onChange={(e) => handleColorChange(e.target.value, 'picker')}
                  className="h-48 w-48 p-1 cursor-pointer"
                />
              </div>
              <div className="space-y-4">
                <ColorDisplay color={hex} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Input Tab */}
        <TabsContent value="manual">
          <Card className="mt-4 shadow-lg">
            <CardHeader>
              <CardTitle>Manual Color Input</CardTitle>
              <CardDescription>
                Enter a color code in HEX, RGB, or HSL to convert it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center gap-4">
                    <div style={{ backgroundColor: hex }} className="h-12 w-12 rounded-md border" />
                    <ColorDisplay color={hex} />
               </div>

              <div className="space-y-4">
                <div>
                  <Label>HEX</Label>
                  <Input value={hex} onChange={(e) => handleColorChange(e.target.value, 'hex')} className='font-mono'/>
                </div>
                <div>
                  <Label>RGB</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={rgb.r} onChange={(e) => handleRgbChange({ ...rgb, r: +e.target.value })} placeholder="R" />
                    <Input type="number" value={rgb.g} onChange={(e) => handleRgbChange({ ...rgb, g: +e.target.value })} placeholder="G" />
                    <Input type="number" value={rgb.b} onChange={(e) => handleRgbChange({ ...rgb, b: +e.target.value })} placeholder="B" />
                  </div>
                </div>
                 <div>
                  <Label>HSL</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={hsl.h} onChange={(e) => handleHslChange({ ...hsl, h: +e.target.value })} placeholder="H" />
                    <Input type="number" value={hsl.s} onChange={(e) => handleHslChange({ ...hsl, s: +e-target.value })} placeholder="S" />
                    <Input type="number" value={hsl.l} onChange={(e) => handleHslChange({ ...hsl, l: +e.target.value })} placeholder="L" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

