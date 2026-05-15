import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export default async function AppNav() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cuenta
        </Link>
      ) : (
        <Link
          href="/auth/login"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ingresar
        </Link>
      )}
    </div>
  );
}
