
"use client";

import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUsageLimiter } from "@/hooks/use-usage-limiter.tsx";

export default function GraphingCalculator() {
    const { toast } = useToast();
    const { checkLimit, incrementUsage, isUserLoading } = useUsageLimiter('graphingCalculator');

    useEffect(() => {
        const onFirstUse = () => {
            if (isUserLoading) return;
            if (!checkLimit()) return;
            incrementUsage();
            window.removeEventListener('click', onFirstUse);
            window.removeEventListener('keydown', onFirstUse);
        };
        window.addEventListener('click', onFirstUse, { once: true });
        window.addEventListener('keydown', onFirstUse, { once: true });
        return () => {
            window.removeEventListener('click', onFirstUse);
            window.removeEventListener('keydown', onFirstUse);
        };
    }, [isUserLoading, checkLimit, incrementUsage]);

    return (
        <Card className="mt-8 shadow-lg overflow-hidden">
            <iframe
                src="https://www.desmos.com/calculator"
                className="w-full h-[70vh] border-0"
                title="Desmos Graphing Calculator"
                allow="autoplay"
            ></iframe>
        </Card>
    );
}
