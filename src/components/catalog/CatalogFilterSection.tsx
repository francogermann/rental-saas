'use client';

import { useState } from 'react';

export function CatalogFilterSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between py-3"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-fuchsia-400">{title}</span>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
          <span className={`text-xs text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>
      {isOpen && <div className="pb-4 pt-1">{children}</div>}
    </div>
  );
}

export function CatalogFilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? 'border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-300'
          : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
