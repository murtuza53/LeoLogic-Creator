"use client";

import { useEffect, useState } from 'react';

type GenerationCounterProps = {
  count: number;
  label: string;
};

export default function GenerationCounter({ count, label }: GenerationCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    setDisplayCount(count);
  }, [count]);

  return (
    <span className="text-xs font-medium text-foreground/80">
      {label}: {displayCount}
    </span>
  );
}
