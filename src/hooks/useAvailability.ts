'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { getBlockedDatesForGarment } from '@/lib/actions/availability';
import type { BlockedDateRange } from '@/types/domain';

interface UseAvailabilityOptions {
    garmentId: string | null;
    monthsAhead?: number;
}

export function useAvailability({
    garmentId,
    monthsAhead = 3,
}: UseAvailabilityOptions) {
    const [blockedRanges, setBlockedRanges] = useState<BlockedDateRange[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const today = new Date();
    const untilDate = new Date(today);
    untilDate.setMonth(untilDate.getMonth() + monthsAhead);

    const fromDate = today.toISOString().split('T')[0];
    const untilStr = untilDate.toISOString().split('T')[0];

    const load = useCallback(() => {
        if (!garmentId) {
            setBlockedRanges([]);
            return;
        }
        setError(null);

        startTransition(async () => {
            const result = await getBlockedDatesForGarment(garmentId, {
                fromDate,
                untilDate: untilStr,
            });

            if (result.error) {
                setError(result.error);
            } else {
                setBlockedRanges(result.data ?? []);
            }
        });
    }, [garmentId, fromDate, untilStr]);

    useEffect(() => {
        load();
    }, [load]);

    const hasConflict = useCallback((pickupDate: Date, returnDate: Date): boolean => {
        return blockedRanges.some((block) => {
            const blockFrom = new Date(block.date_from);
            const blockTo = new Date(block.date_to);
            return pickupDate <= blockTo && returnDate >= blockFrom;
        });
    }, [blockedRanges]);

    return {
        blockedRanges,
        isLoading: isPending,
        error,
        refetch: load,
        hasConflict,
    };
}
