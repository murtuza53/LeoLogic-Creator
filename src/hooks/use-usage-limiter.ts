
"use client";

import { useState, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { type Feature } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const USAGE_LIMIT = 2;
const STORAGE_KEY = 'anonymousUsage';

type UsageData = Partial<Record<Feature, number>>;

/**
 * Hook to manage and enforce usage limits for non-authenticated users.
 * Tracks usage counts in localStorage.
 *
 * @param feature The specific feature being tracked (e.g., 'smartProduct').
 * @returns An object with functions to check limits and increment counts.
 */
export function useUsageLimiter(feature: Feature) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const getUsage = (): UsageData => {
    try {
      const storedUsage = window.localStorage.getItem(STORAGE_KEY);
      return storedUsage ? JSON.parse(storedUsage) : {};
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return {};
    }
  };

  const [usage, setUsage] = useState<UsageData>(getUsage);

  const checkLimit = useCallback((): boolean => {
    if (isUserLoading) return false; // Wait until user state is known
    if (user) return true; // Signed-in users have no limits

    const currentCount = usage[feature] || 0;
    if (currentCount >= USAGE_LIMIT) {
      toast({
        title: 'Usage Limit Reached',
        description: 'You have used this feature twice. Please sign up for unlimited access.',
        action: (
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        ),
        duration: 8000,
      });
      return false;
    }
    return true;
  }, [user, isUserLoading, usage, feature, toast]);

  const incrementUsage = useCallback(() => {
    if (user) return; // Don't track for signed-in users

    try {
        const newUsage = { ...usage };
        const currentCount = newUsage[feature] || 0;
        newUsage[feature] = currentCount + 1;
        
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
        setUsage(newUsage);
    } catch (error) {
        console.error("Error writing to localStorage:", error);
    }
  }, [user, usage, feature]);

  return { checkLimit, incrementUsage, isUserLoading };
}
