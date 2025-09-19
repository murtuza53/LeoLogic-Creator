"use client";

import { useEffect, useState } from 'react';

type GenerationCounterProps = {
  featureKey: string;
  label: string;
};

export default function GenerationCounter({ featureKey, label }: GenerationCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedCount = localStorage.getItem(`generation_count_${featureKey}`);
      setDisplayCount(storedCount ? parseInt(storedCount, 10) : 0);
    };

    // Initial load
    handleStorageChange();

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Custom event to listen for changes within the same tab
    const handleLocalstorageUpdate = (event: Event) => {
        if ((event as CustomEvent).detail.key === `generation_count_${featureKey}`) {
            handleStorageChange();
        }
    };
    window.addEventListener('localstorage-update', handleLocalstorageUpdate);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localstorage-update', handleLocalstorageUpdate);
    };
  }, [featureKey]);

  return (
    <span className="text-xs font-medium text-foreground/80">
      {label}: {displayCount}
    </span>
  );
}
