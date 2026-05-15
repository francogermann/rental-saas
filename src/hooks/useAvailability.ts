'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { startOfDay } from 'date-fns';
import { getBlockedDatesForGarment } from '@/lib/actions/availability';
import { toLocalYmdString, parseLocalYmd } from '@/lib/calendar-date';
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

    const todayStart = startOfDay(new Date());
    const until = startOfDay(new Date());
    until.setMonth(until.getMonth() + monthsAhead);

    const fromDate = toLocalYmdString(todayStart);
    const untilStr = toLocalYmdString(until);

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
        const p = startOfDay(pickupDate);
        const r = startOfDay(returnDate);
        return blockedRanges.some((block) => {
            const blockFrom = parseLocalYmd(block.date_from);
            const blockTo = parseLocalYmd(block.date_to);
            return p <= blockTo && r >= blockFrom;
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
