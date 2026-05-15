import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">Tu cuenta</h1>
        <p className="text-sm text-muted-foreground mb-8">Iniciá sesión para favoritos y lista de espera.</p>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-white/5" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/catalog" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
            Volver al catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}
