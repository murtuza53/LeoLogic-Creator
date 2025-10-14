
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { type Feature } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { incrementToolUsageCounter } from '@/app/actions';

const USAGE_LIMIT = 5;
const STORAGE_KEY = 'anonymousUsage';

type UsageData = Partial<Record<Feature, number>>;
type StoredData = {
  date: string; // YYYY-MM-DD
  usage: UsageData;
};

/**
 * Hook to manage and enforce usage limits for non-authenticated users.
 * Tracks usage counts in localStorage with a daily reset.
 *
 * @param feature The specific feature being tracked (e.g., 'smartProduct').
 * @returns An object with functions to check limits and increment counts.
 */
export function useUsageLimiter(feature: Feature) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const getTodaysDateString = () => new Date().toISOString().split('T')[0];

  const getUsage = (): UsageData => {
    try {
      const storedItem = window.localStorage.getItem(STORAGE_KEY);
      if (!storedItem) return {};
      
      const data: StoredData = JSON.parse(storedItem);
      const today = getTodaysDateString();

      if (data.date === today) {
        return data.usage;
      } else {
        // Date is old, so reset usage
        window.localStorage.removeItem(STORAGE_KEY);
        return {};
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return {};
    }
  };

  const [usage, setUsage] = useState<UsageData>({});

  useEffect(() => {
    // We need to get usage data on the client side
    setUsage(getUsage());
  }, []);

  const checkLimit = useCallback((): boolean => {
    if (isUserLoading) return false; // Wait until user state is known
    if (user) return true; // Signed-in users have no limits

    const currentCount = usage[feature] || 0;
    if (currentCount >= USAGE_LIMIT) {
      toast({
        title: 'Daily Limit Reached',
        description: 'Your daily quota is completed. You can continue tomorrow or sign up for unlimited access.',
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
    // Always increment the global counter
    incrementToolUsageCounter(feature);

    // Only track local storage for anonymous users
    if (user) return;

    try {
        const currentUsage = getUsage(); // Get the most recent usage
        const currentCount = currentUsage[feature] || 0;
        const newUsage: UsageData = { ...currentUsage, [feature]: currentCount + 1 };
        
        const newData: StoredData = {
          date: getTodaysDateString(),
          usage: newUsage,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setUsage(newUsage); // Update state to reflect the change
    } catch (error) {
        console.error("Error writing to localStorage:", error);
    }
  }, [user, feature]);

  return { checkLimit, incrementUsage, isUserLoading };
}
