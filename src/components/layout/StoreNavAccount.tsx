import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export async function StoreNavAccount() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Cuenta
      </Link>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      Ingresar
    </Link>
  );
}
