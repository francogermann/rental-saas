import { loginAdmin } from '@/lib/actions/admin-login';

export const dynamic = 'force-dynamic';

const errorText: Record<string, string> = {
  cred: 'Usuario o contraseña incorrectos.',
  config: 'Falta configurar el acceso admin en el servidor (variables de entorno).',
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const err = searchParams.error ? errorText[searchParams.error] ?? 'No se pudo iniciar sesión.' : null;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
          Carpe Diem — Admin
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Ingresá con tu usuario del panel.</p>

        {err && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <form action={loginAdmin} className="space-y-5">
          {searchParams.next && <input type="hidden" name="next" value={searchParams.next} />}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-muted-foreground">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
            />
          </div>
          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 font-semibold text-white shadow-glow hover:from-fuchsia-500 hover:to-purple-500 transition-all"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
