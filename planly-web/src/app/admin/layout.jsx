'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CheckCircle2, Layers3, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getAuthenticatedHome } from '@/lib/auth-routing';

function AdminTheme() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

      .planly-admin {
        font-family: 'DM Sans', sans-serif;
      }

      .planly-admin .font-display {
        font-family: 'Syne', sans-serif;
      }

      .planly-admin .admin-shell {
        background:
          radial-gradient(circle at top, rgba(16, 185, 129, 0.12), transparent 24%),
          linear-gradient(180deg, #f6f1e8 0%, #f3efe7 100%);
      }

      .planly-admin .admin-card {
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 18px 55px rgba(15, 23, 42, 0.07);
        backdrop-filter: blur(16px);
      }

      .planly-admin .admin-nav-card {
        background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
        border: 1px solid rgba(255,255,255,0.08);
      }
    `}</style>
  );
}

const navItems = [
  { href: '/admin#resumen', label: 'Resumen', icon: BarChart3 },
  { href: '/admin#categorias', label: 'Categorias', icon: Layers3 },
  { href: '/admin#aprobaciones', label: 'Aprobaciones', icon: CheckCircle2 },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { init, isAuthenticated, isLoading, logout, user } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && isAuthenticated) {
      const target = getAuthenticatedHome(user);
      if (target !== '/admin') {
        router.push(target);
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="planly-admin admin-shell min-h-screen text-slate-900">
        <AdminTheme />
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="admin-card w-full max-w-md rounded-[32px] px-8 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/10 text-emerald-700">
              <div className="h-8 w-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
            </div>
            <h2 className="font-display mt-6 text-3xl font-bold text-slate-950">Cargando consola admin</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Estamos preparando categorias, aprobaciones y metricas operativas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="planly-admin admin-shell min-h-screen text-slate-900">
      <AdminTheme />

      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <aside className="hidden w-[300px] shrink-0 xl:block">
          <div className="sticky top-4 rounded-[32px] bg-[#122218] p-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="admin-nav-card rounded-[26px] p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-emerald-500/10 text-emerald-300">
                <Shield className="h-7 w-7" />
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.28em] text-emerald-300/80">Admin console</p>
              <h1 className="font-display mt-3 text-3xl font-bold text-white">Planly Control</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Un espacio pensado para decidir rapido, aprobar con contexto y mantener el catalogo consistente.
              </p>
            </div>

            <nav className="mt-5 space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === '/admin';
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium transition ${
                      active ? 'bg-white/8 text-white' : 'text-slate-300 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Sesion</p>
              <p className="mt-2 text-lg font-semibold text-white">{user?.username}</p>
              <p className="mt-1 text-sm text-slate-400">Acceso administrativo habilitado</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[20px] border border-red-400/12 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/14"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="admin-card sticky top-4 z-20 rounded-[28px] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-emerald-700">Panel administrativo</p>
                <h2 className="font-display mt-2 text-3xl font-bold text-slate-950">Gobierna la plataforma con mas visibilidad</h2>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Acceso activo para <span className="font-semibold text-slate-900">{user?.email}</span>
              </div>
            </div>
          </header>

          <main className="pb-10 pt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
