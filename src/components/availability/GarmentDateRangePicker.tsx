'use client';

import { useState, useCallback, useMemo } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { startOfDay, parseISO } from 'date-fns';
import { useAvailability } from '@/hooks/useAvailability';
import type { BlockedDateRange } from '@/types/domain';
import 'react-day-picker/style.css';

interface GarmentDateRangePickerProps {
    garmentId: string;
    minDays?: number;
    maxDays?: number;
    onRangeSelect: (range: { pickupDate: string; returnDate: string } | null) => void;
}

export function GarmentDateRangePicker({
    garmentId,
    minDays = 1,
    maxDays = 30,
    onRangeSelect,
}: GarmentDateRangePickerProps) {
    const [range, setRange] = useState<DateRange | undefined>();
    const { blockedRanges, isLoading, error } = useAvailability({ garmentId });

    const today = useMemo(() => startOfDay(new Date()), []);

    // Pre-parse blocked ranges once, not on every render
    const parsedBlocks = useMemo(() =>
        blockedRanges.map((b: BlockedDateRange) => ({
            from: parseISO(b.date_from),
            to: parseISO(b.date_to),
        })),
    [blockedRanges]);

    const disabledDays = useMemo<any[]>(() => [
        { before: today },
        ...parsedBlocks.map(b => ({ from: b.from, to: b.to })),
    ], [today, parsedBlocks]);

    const rangeContainsBlockedDay = useCallback(
        (from: Date, to: Date): boolean =>
            parsedBlocks.some(b => from <= b.to && to >= b.from),
        [parsedBlocks],
    );

    const handleSelect = useCallback(
        (selected: DateRange | undefined) => {
            setRange(selected);

            if (!selected?.from || !selected.to) {
                onRangeSelect(null);
                return;
            }

            const from = startOfDay(selected.from);
            const to = startOfDay(selected.to);
            const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;

            if (days < minDays || days > maxDays || rangeContainsBlockedDay(from, to)) {
                setRange(undefined);
                onRangeSelect(null);
                return;
            }

            onRangeSelect({
                pickupDate: from.toISOString().split('T')[0],
                returnDate: to.toISOString().split('T')[0],
            });
        },
        [minDays, maxDays, rangeContainsBlockedDay, onRangeSelect],
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-56 text-muted-foreground text-sm gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Cargando disponibilidad…
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 w-full overflow-x-auto">
            {/* 
              - sm/mobile: 1 month column
              - md+: 2 months side by side
              We control this via CSS: show the second month container only on md+
            */}
            <style>{`
                @media (max-width: 767px) {
                    .rdp-months { flex-direction: column; }
                    .rdp-months .rdp-month:nth-child(2) { display: none; }
                }
                .rdp-day_selected:not(.rdp-day_range_middle) .rdp-day_button {
                    background-color: hsl(var(--primary));
                    color: hsl(var(--primary-foreground));
                    border-radius: 0.5rem;
                }
                .rdp-day_range_middle .rdp-day_button {
                    background: hsl(var(--primary) / 0.12);
                    color: hsl(var(--primary));
                    border-radius: 0;
                }
                .rdp-day_button:hover:not(:disabled) {
                    background: hsl(var(--accent));
                }
            `}</style>

            <DayPicker
                mode="range"
                locale={es}
                selected={range}
                onSelect={handleSelect}
                disabled={disabledDays}
                numberOfMonths={2}
                showOutsideDays={false}
            />

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-primary" />
                    Seleccionado
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-muted-foreground/20" />
                    No disponible
                </span>
            </div>

            {range?.from && range?.to && (
                <RangeSummary from={range.from} to={range.to} minDays={minDays} maxDays={maxDays} />
            )}
        </div>
    );
}

function RangeSummary({ from, to, minDays, maxDays }: { from: Date; to: Date; minDays: number; maxDays: number }) {
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    const fmt = (d: Date) => d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long' });
    const isValid = days >= minDays && days <= maxDays;

    return (
        <div className={[
            'rounded-lg border px-4 py-3 text-sm',
            isValid
                ? 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400'
                : 'border-destructive/30 bg-destructive/5 text-destructive',
        ].join(' ')}>
            <p className="font-medium">{fmt(from)} → {fmt(to)}</p>
            <p className="mt-0.5 text-xs opacity-80">
                {isValid
                    ? `${days} ${days === 1 ? 'día' : 'días'} de alquiler`
                    : days > maxDays
                        ? `Máximo ${maxDays} días`
                        : `Mínimo ${minDays} ${minDays === 1 ? 'día' : 'días'}`}
            </p>
        </div>
    );
}
