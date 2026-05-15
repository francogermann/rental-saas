import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { formatUy } from '@/lib/utils';

export default async function DashboardFavoritesPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/dashboard/favorites');

  const { data: favRows } = await supabase
    .from('favorite_garments')
    .select('garment_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const garmentIds = favRows?.map((r) => r.garment_id) ?? [];

  const admin = createAdminClient();
  let garments: {
    id: string;
    name: string;
    sku: string;
    rental_price: number | null;
    photos_urls: string[] | null;
    deleted_at: string | null;
  }[] = [];

  if (garmentIds.length > 0) {
    const { data } = await admin
      .from('garments')
      .select('id, name, sku, rental_price, photos_urls, deleted_at')
      .in('id', garmentIds)
      .is('deleted_at', null);
    garments = data ?? [];
  }

  const order = new Map(garmentIds.map((id, i) => [id, i]));
  const favorites = [...garments].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return (
    <div className="container mx-auto max-w-5xl px-6 py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Favoritos</h1>
          <p className="mt-1 text-muted-foreground">Tus prendas guardadas</p>
        </div>
        <Link href="/dashboard" className="text-sm text-fuchsia-400 hover:text-fuchsia-300">
          ← Panel
        </Link>
      </div>

      {favorites.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-muted-foreground">
          Todavía no tenés favoritos.{' '}
          <Link href="/catalog" className="text-fuchsia-400 underline-offset-4 hover:underline">
            Explorar catálogo
          </Link>
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((g) => (
            <li key={g.id}>
              <Link
                href={`/catalog/${g.id}`}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-fuchsia-500/30"
              >
                <div className="relative aspect-[3/4] bg-muted">
                  {g.photos_urls?.[0] ? (
                    <Image
                      src={g.photos_urls[0]}
                      alt={g.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">Sin foto</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-display font-semibold line-clamp-1">{g.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">SKU {g.sku}</p>
                  <p className="mt-2 font-bold">{formatUy(g.rental_price)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
