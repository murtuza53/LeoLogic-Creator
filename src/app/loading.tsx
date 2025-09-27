import { Logo } from '@/components/icons';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute h-full w-full animate-pulse rounded-full bg-primary/10"></div>
        <div className="absolute h-2/3 w-2/3 animate-pulse rounded-full bg-primary/20"></div>
        <Logo className="relative h-16 w-16 text-primary" />
      </div>
    </div>
  );
}
