
'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, ClipboardCheck, LoaderCircle, Trash2 } from 'lucide-react';
import { useUsageLimiter } from '@/hooks/use-usage-limiter.tsx';

// --- Crypto Logic ---

// Derive a key from a password (pin) and a salt.
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a piece of text.
async function encryptText(plainText: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await getKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plainText)
  );

  const encryptedBytes = new Uint8Array(encryptedContent);
  const resultBytes = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
  resultBytes.set(salt, 0);
  resultBytes.set(iv, salt.length);
  resultBytes.set(encryptedBytes, salt.length + iv.length);
  
  // Convert bytes to Base64 string to make it easily transportable.
  return btoa(String.fromCharCode.apply(null, Array.from(resultBytes)));
}

// Decrypt a base64 encoded string.
async function decryptText(encryptedData: string, pin: string): Promise<string> {
    try {
        const encryptedBytesWithMeta = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
        
        const salt = encryptedBytesWithMeta.slice(0, 16);
        const iv = encryptedBytesWithMeta.slice(16, 28);
        const encryptedContent = encryptedBytesWithMeta.slice(28);

        const key = await getKey(pin, salt);

        const decryptedContent = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            encryptedContent
        );

        const dec = new TextDecoder();
        return dec.decode(decryptedContent);
    } catch (e) {
        console.error(e);
        throw new Error("Decryption failed. The PIN or encrypted key is likely incorrect.");
    }
}


const encryptSchema = z.object({
  secureText: z.string().min(1, 'Please enter some text to encrypt.'),
  securePin: z.string().min(4, 'PIN must be at least 4 characters long.'),
});

const decryptSchema = z.object({
  encryptedKey: z.string().min(1, 'Please enter the encrypted key.'),
  securePinDecrypt: z.string().min(1, 'Please enter the PIN.'),
});


export default function EncryptDecrypt() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('encryptDecrypt');
  const [encryptedOutput, setEncryptedOutput] = useState('');
  const [decryptedOutput, setDecryptedOutput] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const encryptForm = useForm<z.infer<typeof encryptSchema>>({
    resolver: zodResolver(encryptSchema),
    defaultValues: { secureText: '', securePin: '' },
  });

  const decryptForm = useForm<z.infer<typeof decryptSchema>>({
    resolver: zodResolver(decryptSchema),
    defaultValues: { encryptedKey: '', securePinDecrypt: '' },
  });
  
  const handleEncrypt = async (values: z.infer<typeof encryptSchema>) => {
    if (isUserLoading) return toast({ description: "Verifying user..." });
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setEncryptedOutput('');
    try {
        const result = await encryptText(values.secureText, values.securePin);
        setEncryptedOutput(result);
        toast({ title: "Encryption Successful!" });
    } catch(e) {
        toast({ variant: 'destructive', title: "Encryption Failed", description: "An unknown error occurred." });
    }
    setIsLoading(false);
  };
  
  const handleDecrypt = async (values: z.infer<typeof decryptSchema>) => {
    if (isUserLoading) return toast({ description: "Verifying user..." });
    if (!checkLimit()) return;
    incrementUsage();

    setIsLoading(true);
    setDecryptedOutput('');
    try {
        const result = await decryptText(values.encryptedKey, values.securePinDecrypt);
        setDecryptedOutput(result);
        toast({ title: "Decryption Successful!" });
    } catch(e: any) {
        toast({ variant: 'destructive', title: "Decryption Failed", description: e.message });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, type: 'key' | 'text') => {
      navigator.clipboard.writeText(text).then(() => {
          if (type === 'key') {
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
          } else {
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2000);
          }
          toast({ title: `Copied to clipboard!` });
      });
  };

  return (
    <div className="mt-8">
      <Tabs defaultValue="encrypt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encrypt">Encrypt Text</TabsTrigger>
          <TabsTrigger value="decrypt">Decrypt Text</TabsTrigger>
        </TabsList>

        {/* Encrypt Tab */}
        <TabsContent value="encrypt">
          <Card className="mt-4 shadow-lg">
            <CardContent className="p-6 space-y-6">
               <form onSubmit={encryptForm.handleSubmit(handleEncrypt)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="secureText">Secure Text</Label>
                    <Textarea id="secureText" placeholder="Write your secure text from here..." {...encryptForm.register("secureText")} />
                    {encryptForm.formState.errors.secureText && <p className='text-sm text-destructive'>{encryptForm.formState.errors.secureText.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="securePin">Secure Pin</Label>
                     <div className="flex gap-4">
                        <Input id="securePin" type="password" {...encryptForm.register("securePin")} />
                        <Button type="submit" disabled={isLoading} className='w-40'>
                            {isLoading ? <LoaderCircle className='animate-spin' /> : "Encrypt Data"}
                        </Button>
                     </div>
                    {encryptForm.formState.errors.securePin && <p className='text-sm text-destructive'>{encryptForm.formState.errors.securePin.message}</p>}
                  </div>
               </form>
                <div className="space-y-2">
                    <Label htmlFor="encryptedKey">Encrypted Key</Label>
                     <div className="flex gap-4">
                        <Input id="encryptedKey" readOnly value={encryptedOutput} placeholder="Encrypt to see key" />
                        <Button variant="outline" onClick={() => copyToClipboard(encryptedOutput, 'key')} disabled={!encryptedOutput} className='w-40'>
                            {copiedKey ? <ClipboardCheck /> : <Clipboard />}
                            Copy Key
                        </Button>
                     </div>
                </div>
                <Button variant="outline" onClick={() => { encryptForm.reset(); setEncryptedOutput(''); }}>
                    <Trash2 className='mr-2' /> Clear All
                </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Decrypt Tab */}
        <TabsContent value="decrypt">
          <Card className="mt-4 shadow-lg">
            <CardContent className="p-6 space-y-6">
                <form onSubmit={decryptForm.handleSubmit(handleDecrypt)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="encryptedKeyDecrypt">Encrypted Key</Label>
                    <Textarea id="encryptedKeyDecrypt" placeholder="Paste your encrypted key here..." {...decryptForm.register("encryptedKey")} />
                    {decryptForm.formState.errors.encryptedKey && <p className='text-sm text-destructive'>{decryptForm.formState.errors.encryptedKey.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="securePinDecrypt">Secure Pin</Label>
                     <div className="flex gap-4">
                        <Input id="securePinDecrypt" type="password" {...decryptForm.register("securePinDecrypt")} />
                        <Button type="submit" disabled={isLoading} className='w-40'>
                            {isLoading ? <LoaderCircle className='animate-spin' /> : "Decrypt Data"}
                        </Button>
                     </div>
                    {decryptForm.formState.errors.securePinDecrypt && <p className='text-sm text-destructive'>{decryptForm.formState.errors.securePinDecrypt.message}</p>}
                  </div>
               </form>
               <div className="space-y-2">
                    <Label htmlFor="decryptedText">Decrypted Text</Label>
                     <div className="flex gap-4">
                        <Textarea id="decryptedText" readOnly value={decryptedOutput} placeholder="Decrypt to see text" />
                        <Button variant="outline" onClick={() => copyToClipboard(decryptedOutput, 'text')} disabled={!decryptedOutput} className='w-40'>
                             {copiedText ? <ClipboardCheck /> : <Clipboard />}
                            Copy Text
                        </Button>
                     </div>
                </div>
                <Button variant="outline" onClick={() => { decryptForm.reset(); setDecryptedOutput(''); }}>
                    <Trash2 className='mr-2' /> Clear All
                </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
