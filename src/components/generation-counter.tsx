import { Skeleton } from './ui/skeleton';

type GenerationCounterProps = {
  count?: number;
  label: string;
  isLoading: boolean;
};

export default function GenerationCounter({ count, label, isLoading }: GenerationCounterProps) {
  if (isLoading) {
    return <Skeleton className="h-4 w-2/3 mx-auto" />;
  }
  
  return (
    <span className="text-xs font-medium text-foreground/80">
      {label}: {count ?? 0}
    </span>
  );
}
