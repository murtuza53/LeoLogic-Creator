import { config } from 'dotenv';
config();

import '@/ai/flows/generate-product-specifications.ts';
import '@/ai/flows/generate-product-description.ts';
import '@/ai/flows/generate-product-image.ts';
import '@/ai/flows/generate-additional-product-images.ts';
import '@/ai/flows/solve-math-problem.ts';
import '@/ai/flows/extract-text-from-image.ts';
import '@/ai/flows/extract-table-from-image.ts';
import '@/ai/flows/convert-image-to-webp.ts';
import '@/ai/flows/remove-background.ts';
import '@/ai/flows/change-background.ts';
import '@/ai/flows/resize-crop-image.ts';
