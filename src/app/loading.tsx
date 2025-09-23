import { Logo } from '@/components/icons';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Logo className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
