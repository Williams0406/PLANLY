'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ArrowRight,
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Metricas, foco y resumen del negocio.',
  },
  {
    href: '/dashboard/servicios',
    icon: BriefcaseBusiness,
    label: 'Mis servicios',
    description: 'Tu catalogo activo, promociones y estado general.',
  },
  {
    href: '/dashboard/servicios/nuevo',
    icon: Plus,
    label: 'Crear servicio',
    description: 'Publica una nueva experiencia en pocos pasos.',
  },
];

function isActiveRoute(pathname, href) {
  if (href === '/dashboard') {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-[304px] transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="m-4 flex h-[calc(100vh-2rem)] flex-col rounded-[32px] border border-white/10 bg-[#081728]/92 p-5 shadow-[0_30px_90px_rgba(2,8,23,0.55)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" onClick={onClose}>
              <div className="rounded-[20px] border border-cyan-400/20 bg-cyan-500/10 p-2.5">
                <Image
                  src="/images/LogoIcon.png"
                  alt="Planly"
                  width={42}
                  height={42}
                  className="rounded-2xl"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold text-white">Planly</p>
                <p className="truncate text-sm text-slate-400">Business workspace</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 lg:hidden"
              aria-label="Cerrar menu lateral"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 rounded-[28px] border border-cyan-500/12 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(34,211,238,0.04))] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/8 text-cyan-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Cuenta activa</p>
                <h2 className="font-display mt-2 text-2xl font-bold text-white">
                  {user?.username || 'Tu negocio'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Espacio pensado para mantener tu operacion mas clara, visible y profesional.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/8 bg-[#07111F]/60 px-4 py-3">
              <div>
                <p className="text-xs text-slate-500">Estado</p>
                <p className="text-sm font-semibold text-white">
                  {user?.entidad_aprobada ? 'Proveedor verificado' : 'Perfil de proveedor'}
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-300">
                En linea
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {NAV_ITEMS.map(({ href, icon: Icon, label, description }) => {
              const active = isActiveRoute(pathname, href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={clsx(
                    'group block rounded-[24px] border px-4 py-4 transition-all duration-200',
                    active
                      ? 'border-cyan-400/20 bg-cyan-500/10 shadow-[0_18px_50px_rgba(8,145,178,0.16)]'
                      : 'border-white/6 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition',
                          active
                            ? 'bg-cyan-500/14 text-cyan-300'
                            : 'bg-white/6 text-slate-300 group-hover:text-white'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={clsx('text-sm font-semibold', active ? 'text-white' : 'text-slate-100')}>
                          {label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                      </div>
                    </div>

                    <ArrowRight
                      className={clsx(
                        'mt-1 h-4 w-4 shrink-0 transition',
                        active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-white/8 pt-5">
            <Link
              href="/dashboard/servicios/nuevo"
              onClick={onClose}
              className="flex items-center justify-between rounded-[24px] border border-amber-400/14 bg-amber-500/10 px-4 py-4 transition hover:bg-amber-500/14"
            >
              <div>
                <p className="text-sm font-semibold text-white">Lanza algo nuevo</p>
                <p className="mt-1 text-sm text-slate-300">Publica otra experiencia y mueve tu catalogo.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-amber-300">
                <Plus className="h-5 w-5" />
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-slate-300 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
