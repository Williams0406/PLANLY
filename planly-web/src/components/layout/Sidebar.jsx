'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Briefcase, Plus,
  User, LogOut, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/servicios', icon: Briefcase, label: 'Mis Servicios' },
  { href: '/dashboard/servicios/nuevo', icon: Plus, label: 'Nuevo Servicio' },
  { href: '/dashboard/perfil', icon: User, label: 'Mi Perfil' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center">
            <span className="text-white">🏢</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Planly Business</p>
            <p className="text-slate-400 text-xs truncate max-w-[120px]">
              {user?.username}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-xl',
                'text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} />
                {label}
              </div>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm font-medium text-slate-400 hover:text-red-400
            hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}