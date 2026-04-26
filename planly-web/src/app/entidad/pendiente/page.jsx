'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getAuthenticatedHome } from '@/lib/auth-routing';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

export default function EntidadPendingPage() {
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
      if (target !== '/entidad/pendiente') {
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
      <div className="min-h-screen bg-[#07111F] font-body text-white">
        <FontStyle />
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.05] px-8 py-10 text-center backdrop-blur">
            <div className="mx-auto h-10 w-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
            <p className="mt-4 text-sm text-slate-400">Cargando estado de aprobacion...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,#07111F_0%,#0B1626_100%)] font-body text-white">
      <FontStyle />

      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <div className="w-full rounded-[36px] border border-white/10 bg-[#0B1626]/90 p-8 shadow-[0_30px_90px_rgba(2,8,23,0.35)] backdrop-blur sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Revision en curso
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1 className="font-display text-5xl font-extrabold leading-[0.96] tracking-tight text-white sm:text-6xl">
                Tu perfil esta
                <span className="block bg-gradient-to-r from-cyan-300 to-sky-500 bg-clip-text text-transparent">
                  pendiente de aprobacion.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Ya recibimos la informacion de tu entidad. Cuando el equipo la apruebe, se activara tu dashboard para publicar y gestionar servicios.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/entidad/setup"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Editar perfil enviado
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-400/15 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/14"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <Clock3 className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">Siguiente paso</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  El equipo revisara tus datos antes de habilitar el acceso al panel de gestion empresarial.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">Por que existe este filtro</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Nos ayuda a mantener el catalogo mas confiable, profesional y alineado con la experiencia de Planly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
