'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const { user, isAuthenticated, init, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => { init(); }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const dashboardHref = user?.tipo_usuario === 'entidad'
    ? '/dashboard'
    : '/dashboard';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🗺️</span>
            </div>
            <span className="font-bold text-xl text-slate-900">Planly</span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/servicios"
              className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors"
            >
              Explorar servicios
            </Link>
            {isAuthenticated && (
              <Link
                href={dashboardHref}
                className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 hidden sm:block">
                  Hola, <strong>{user?.username}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  Salir
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Iniciar sesión</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}