'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutList, Menu, Plus, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import { getAuthenticatedHome } from '@/lib/auth-routing';

function getRouteMeta(pathname) {
  if (pathname === '/dashboard') {
    return {
      eyebrow: 'Panel general',
      title: 'Tu negocio en una sola vista',
      description: 'Sigue el estado de tus servicios, detecta oportunidades y toma decisiones mas rapido.',
    };
  }

  if (pathname === '/dashboard/servicios') {
    return {
      eyebrow: 'Catalogo activo',
      title: 'Gestiona tu portafolio',
      description: 'Filtra, prioriza y ajusta tus publicaciones desde una vista mas clara y accionable.',
    };
  }

  if (pathname === '/dashboard/servicios/nuevo') {
    return {
      eyebrow: 'Nuevo servicio',
      title: 'Publica una experiencia convincente',
      description: 'Completa la informacion clave para que tu oferta se vea profesional y lista para convertir.',
    };
  }

  if (pathname.includes('/editar')) {
    return {
      eyebrow: 'Edicion',
      title: 'Refina tu servicio',
      description: 'Actualiza detalles, horarios y precios para que tu publicacion siga siendo competitiva.',
    };
  }

  return {
    eyebrow: 'Workspace',
    title: 'Planly Business',
    description: 'Organiza tu operacion diaria con una experiencia mas clara y enfocada.',
  };
}

function DashboardTheme() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');

      .planly-dashboard {
        font-family: 'DM Sans', sans-serif;
      }

      .planly-dashboard .font-display {
        font-family: 'Syne', sans-serif;
      }

      .planly-dashboard .dashboard-grid::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(34, 211, 238, 0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34, 211, 238, 0.045) 1px, transparent 1px);
        background-size: 60px 60px;
        mask-image: radial-gradient(circle at top, black 18%, transparent 72%);
      }

      .planly-dashboard .dashboard-surface {
        background: linear-gradient(180deg, rgba(13, 27, 45, 0.94), rgba(9, 20, 35, 0.9));
        border: 1px solid rgba(148, 163, 184, 0.12);
        box-shadow: 0 28px 80px rgba(2, 8, 23, 0.36);
        backdrop-filter: blur(18px);
      }

      .planly-dashboard .dashboard-soft-surface {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.035));
        border: 1px solid rgba(148, 163, 184, 0.1);
        backdrop-filter: blur(18px);
      }

      .planly-dashboard .dashboard-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 999px;
        border: 1px solid rgba(34, 211, 238, 0.18);
        background: rgba(34, 211, 238, 0.08);
        padding: 0.55rem 0.95rem;
        color: #a5f3fc;
      }

      .planly-dashboard .dashboard-hover-lift {
        transition:
          transform 0.22s ease,
          border-color 0.22s ease,
          box-shadow 0.22s ease,
          background-color 0.22s ease;
      }

      .planly-dashboard .dashboard-hover-lift:hover {
        transform: translateY(-4px);
        border-color: rgba(34, 211, 238, 0.22);
        box-shadow: 0 26px 64px rgba(8, 47, 73, 0.28);
      }

      .planly-dashboard .dashboard-kicker {
        letter-spacing: 0.26em;
        text-transform: uppercase;
      }

      @keyframes dashboard-fade-up {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .planly-dashboard .dashboard-enter {
        animation: dashboard-fade-up 0.55s ease both;
      }
    `}</style>
  );
}

export default function DashboardLayout({ children }) {
  const { isAuthenticated, isLoading, init, user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      if (target !== '/dashboard' && !target.startsWith('/dashboard/')) {
        router.push(target);
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="planly-dashboard min-h-screen bg-[#07111F] text-white">
        <DashboardTheme />
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="dashboard-surface dashboard-enter w-full max-w-sm rounded-[28px] p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-cyan-500/12">
              <div className="h-8 w-8 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
            </div>
            <h2 className="font-display mt-6 text-2xl font-bold text-white">Cargando tu dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Estamos preparando tus metricas, accesos y el estado actual de tus servicios.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const routeMeta = getRouteMeta(pathname);
  const isEditingRoute = pathname === '/dashboard/servicios/nuevo' || pathname.includes('/editar');
  const quickAction = isEditingRoute
    ? { href: '/dashboard/servicios', label: 'Ver catalogo', icon: LayoutList }
    : { href: '/dashboard/servicios/nuevo', label: 'Nuevo servicio', icon: Plus };
  const QuickActionIcon = quickAction.icon;
  const currentDateLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="planly-dashboard dashboard-grid relative min-h-screen overflow-hidden bg-[#07111F] text-white">
      <DashboardTheme />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(250,204,21,0.12),transparent_20%),linear-gradient(180deg,#07111F_0%,#091629_100%)]" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative lg:pl-[304px]">
        <header className="sticky top-0 z-30 border-b border-white/8 bg-[#07111F]/72 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 lg:hidden"
                aria-label="Abrir menu lateral"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="dashboard-kicker text-[11px] text-cyan-300/75">{routeMeta.eyebrow}</p>
                <h1 className="font-display truncate text-xl font-bold text-white sm:text-2xl">{routeMeta.title}</h1>
                <p className="hidden text-sm text-slate-400 md:block">{routeMeta.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/8 bg-white/5 px-4 py-2 text-right md:block">
                <p className="dashboard-kicker text-[10px] text-slate-500">Hoy</p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-200">{currentDateLabel}</p>
              </div>

              <div className="hidden items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-2.5 lg:flex">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Sesion activa</p>
                  <p className="text-sm font-semibold text-white">{user?.username || 'Tu cuenta'}</p>
                </div>
              </div>

              <Link
                href={quickAction.href}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
              >
                <QuickActionIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{quickAction.label}</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
