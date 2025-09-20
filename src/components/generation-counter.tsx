"use client";

type GenerationCounterProps = {
  count: number;
  label: string;
};

export default function GenerationCounter({ count, label }: GenerationCounterProps) {
  return (
    <span className="text-xs font-medium text-foreground/80">
      {label}: {count}
    </span>
  );
}
