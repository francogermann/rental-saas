import Link from 'next/link';
import { Suspense } from 'react';
import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Registrate para guardar favoritos y anotarte en listas de espera.
        </p>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/5" />}>
          <SignupForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link href="/auth/login" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
            Ingresar
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          <Link href="/catalog" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
            Volver al catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}
