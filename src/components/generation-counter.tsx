"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

type GenerationCounterProps = {
  featureKey: string;
  count: number;
};

export default function GenerationCounter({ featureKey, count }: GenerationCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const storedCount = localStorage.getItem(`generation_count_${featureKey}`);
    setDisplayCount(storedCount ? parseInt(storedCount, 10) : 0);
  }, [featureKey]);

  useEffect(() => {
    if (count > 0) {
      const newCount = displayCount + 1;
      localStorage.setItem(`generation_count_${featureKey}`, newCount.toString());
      setDisplayCount(newCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, featureKey]);


  return (
    <Badge variant="outline" className="hidden md:flex">
      Generations: {displayCount}
    </Badge>
  );
}
