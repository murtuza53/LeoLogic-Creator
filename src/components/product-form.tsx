"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoaderCircle, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const formSchema = z.object({
  productName: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }).max(100, {
    message: "Product name must not exceed 100 characters."
  }),
  productImage: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "An image is required.")
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 1MB.`),
  additionalInfo: z.string().max(500, {
    message: "Additional information must not exceed 500 characters."
  }).optional(),
  generateAdditionalImages: z.boolean().default(false),
});

type ProductFormProps = {
  onGenerate: (name: string, imageFile: File, generateAdditionalImages: boolean, additionalInfo?: string) => void;
  isLoading: boolean;
};

export default function ProductForm({ onGenerate, isLoading }: ProductFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      additionalInfo: "",
      generateAdditionalImages: false,
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const imageFile = values.productImage[0];
    onGenerate(values.productName, imageFile, values.generateAdditionalImages, values.additionalInfo);
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
    form.setValue('productImage', event.target.files as FileList);
    form.trigger('productImage');
  };

  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>Enter a name and upload an image for your product.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 'Modern Leather Armchair'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="productImage"
              render={() => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    <div 
                      className="relative mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center">
                        {preview ? (
                          <div className="relative mx-auto h-40 w-40">
                            <Image src={preview} alt="Image preview" fill className="object-contain" />
                          </div>
                        ) : (
                          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        )}
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                          <span className="font-semibold text-primary">
                            Upload a file
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground/80">PNG, JPG, WEBP (Max 1MB)</p>
                        <input 
                            id="file-upload" 
                            type="file" 
                            className="sr-only"
                            ref={fileInputRef}
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            onChange={handleImageChange}
                          />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Made from sustainably sourced oak, features a minimalist design...'"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                    Provide any extra details that could help generate better content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="generateAdditionalImages"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Generate Additional Images
                    </FormLabel>
                    <FormDescription>
                      Create multiple variations of your product image.
                    </FormDescription>
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


            <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base py-6">
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Content"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
