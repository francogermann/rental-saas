'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { toggleFavoriteGarment } from '@/lib/actions/favorites';

type Props = {
  garmentId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  redirectPath: string;
  className?: string;
};

export function FavoriteHeart({ garmentId, initialFavorited, isLoggedIn, redirectPath, className = '' }: Props) {
  const [on, setOn] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  if (!isLoggedIn) {
    const href = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
    return (
      <Link
        href={href}
        title="Ingresá para guardar favoritos"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/80 backdrop-blur-md transition hover:border-fuchsia-500/40 hover:text-fuchsia-300 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Heart className="h-5 w-5" strokeWidth={1.75} />
      </Link>
    );
  }

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    const res = await toggleFavoriteGarment(garmentId);
    setPending(false);
    if (res.data) setOn(res.data.favorited);
  }

  return (
    <button
      type="button"
      title={on ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      disabled={pending}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md transition hover:border-fuchsia-500/40 disabled:opacity-50 ${className} ${
        on ? 'text-fuchsia-400' : 'text-white/80 hover:text-fuchsia-300'
      }`}
    >
      <Heart className="h-5 w-5" strokeWidth={1.75} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}
