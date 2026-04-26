'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAuthenticatedHome } from '@/lib/auth-routing';

export default function Navbar() {
  const { user, isAuthenticated, init, logout } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  /* init auth */
  useEffect(() => { init(); }, []);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* close mobile menu on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const dashboardHref = getAuthenticatedHome(user);

  const isLanding = pathname === '/';

  /* ── nav links ── */
  const navLinks = [
    { href: '/servicios', label: 'Explorar servicios' },
    ...(isAuthenticated ? [{ href: dashboardHref, label: user?.is_admin ? 'Admin' : 'Mi espacio' }] : []),
  ];

  return (
    <>
      <nav
        className={`
          sticky top-0 z-50 transition-all duration-300
          ${isLanding
            ? scrolled
              ? 'bg-[#080E1C]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_32px_rgba(0,0,0,0.4)]'
              : 'bg-transparent border-b border-transparent'
            : 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <Image
                src="/images/LogoIcon.png"
                alt="Planly Logo"
                width={50}
                height={50}
                className="rounded-lg shadow-lg shadow-cyan-500/20 transition-transform duration-200 group-hover:scale-105"
              />
              <span
                className={`font-bold text-xl tracking-tight transition-colors duration-200
                  ${isLanding ? 'text-white' : 'text-slate-900'}
                `}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Planly
              </span>
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isLanding
                        ? active
                          ? 'text-cyan-400 bg-cyan-500/10'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.07]'
                        : active
                          ? 'text-cyan-600 bg-cyan-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                    `}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── Auth buttons (desktop) ── */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <span
                    className={`text-sm hidden lg:block transition-colors
                      ${isLanding ? 'text-slate-400' : 'text-slate-500'}
                    `}
                  >
                    Hola,{' '}
                    <strong className={isLanding ? 'text-white' : 'text-slate-800'}>
                      {user?.username}
                    </strong>
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isLanding
                        ? 'text-slate-400 hover:text-white hover:bg-white/[0.07]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <button
                      className={`
                        px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                        ${isLanding
                          ? 'text-slate-300 hover:text-white hover:bg-white/[0.07]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }
                      `}
                    >
                      Iniciar sesión
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-px active:translate-y-0">
                      Registrarse
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menú"
              className={`
                md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg transition-colors
                ${isLanding ? 'hover:bg-white/[0.08]' : 'hover:bg-slate-100'}
              `}
            >
              <span
                className={`block h-[2px] w-5 rounded-full transition-all duration-300 origin-center
                  ${isLanding ? 'bg-white' : 'bg-slate-700'}
                  ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}
                `}
              />
              <span
                className={`block h-[2px] w-5 rounded-full transition-all duration-300
                  ${isLanding ? 'bg-white' : 'bg-slate-700'}
                  ${mobileOpen ? 'opacity-0 scale-x-0' : ''}
                `}
              />
              <span
                className={`block h-[2px] w-5 rounded-full transition-all duration-300 origin-center
                  ${isLanding ? 'bg-white' : 'bg-slate-700'}
                  ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}
                `}
              />
            </button>

          </div>
        </div>

        {/* ── Mobile menu ── */}
        <div
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-in-out
            ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
            ${isLanding
              ? 'bg-[#080E1C]/97 border-t border-white/[0.06]'
              : 'bg-white border-t border-slate-100'
            }
          `}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">

            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${isLanding
                      ? active
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                      : active
                        ? 'text-cyan-600 bg-cyan-50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  {label}
                </Link>
              );
            })}

            <div
              className={`my-2 h-px ${isLanding ? 'bg-white/[0.06]' : 'bg-slate-100'}`}
            />

            {isAuthenticated ? (
              <>
                <div
                  className={`px-4 py-2 text-sm ${isLanding ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  Hola,{' '}
                  <strong className={isLanding ? 'text-white' : 'text-slate-800'}>
                    {user?.username}
                  </strong>
                </div>
                <button
                  onClick={handleLogout}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${isLanding
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button
                    className={`
                      w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors
                      ${isLanding
                        ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    Iniciar sesión
                  </button>
                </Link>
                <Link href="/register">
                  <button className="w-full mt-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-cyan-500/20">
                    Registrarse →
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
