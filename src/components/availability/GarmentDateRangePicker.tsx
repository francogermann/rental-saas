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

    const disabledDays = useMemo(() => [
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
        <div className="garment-date-rdp flex flex-col gap-3 w-full overflow-x-auto">
            {/*
              react-day-picker v9: el CSS por defecto usa --rdp-accent-background-color (#f0f0ff) y
              range_middle con color inherit → en tema oscuro los números quedan claros sobre fondo claro.
              Sobrescribimos variables en .rdp-root (v9 ya no usa .rdp-day_selected / .rdp-day_range_middle).
            */}
            <style>{`
                .garment-date-rdp .rdp-root {
                    --rdp-accent-color: hsl(315 100% 58%);
                    /* Fondo del rango (medio): oscuro semitransparente, no blanco */
                    --rdp-accent-background-color: hsl(280 40% 22% / 0.72);
                    --rdp-range_middle-background-color: hsl(280 38% 20% / 0.78);
                    --rdp-range_middle-color: hsl(0 0% 96%);
                    --rdp-range_start-color: hsl(0 0% 100%);
                    --rdp-range_end-color: hsl(0 0% 100%);
                    --rdp-today-color: hsl(315 100% 72%);
                    color: hsl(var(--foreground));
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                .garment-date-rdp .rdp-weekday {
                    color: hsl(var(--muted-foreground));
                    opacity: 1;
                }
                .garment-date-rdp .rdp-caption_label {
                    color: hsl(var(--foreground));
                }
                .garment-date-rdp .rdp-nav_button {
                    color: hsl(var(--foreground));
                }
                .garment-date-rdp .rdp-day_button {
                    color: hsl(var(--foreground));
                }
                .garment-date-rdp .rdp-day_button:hover:not(:disabled) {
                    background-color: hsl(var(--muted));
                    color: hsl(var(--foreground));
                }
                .garment-date-rdp .rdp-disabled .rdp-day_button {
                    color: hsl(var(--muted-foreground));
                }
                @media (max-width: 767px) {
                    .garment-date-rdp .rdp-months { flex-direction: column; align-items: center; }
                    .garment-date-rdp .rdp-months .rdp-month:nth-child(2) { display: none; }
                    .garment-date-rdp .rdp-day_button { width: 38px; height: 38px; }
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
    const fmt = (d: Date) => d.toLocaleDateString('es-UY', { day: '2-digit', month: 'long' });
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
