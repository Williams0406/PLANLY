'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { getAuthenticatedHome } from '@/lib/auth-routing';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form.username, form.password);
      router.push(getAuthenticatedHome(user));
    } catch (err) {
      setError(err.response?.data?.detail || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)] font-body text-slate-900">
      <FontStyle />

      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <section className="hidden lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
              <Image
                src="/images/LogoIcon.png"
                alt="Planly Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
              Volver a Planly
            </Link>

            <div className="mt-12 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Acceso empresarial
              </div>
              <h1 className="font-display mt-6 text-6xl font-extrabold leading-[0.95] tracking-tight text-slate-950">
                Gestiona tu empresa
                <span className="block bg-gradient-to-r from-cyan-600 to-sky-500 bg-clip-text text-transparent">
                  con más claridad.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Entra a tu panel, publica servicios, organiza tu operación y mantén una experiencia profesional desde el primer clic.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Building2,
                title: 'Servicios activos',
                copy: 'Gestiona tu oferta desde un panel más ordenado y comercial.',
              },
              {
                icon: ShieldCheck,
                title: 'Acceso seguro',
                copy: 'Mantén tu cuenta lista para operar sin fricción innecesaria.',
              },
              {
                icon: ArrowRight,
                title: 'Flujo rápido',
                copy: 'Entra, revisa y actúa con una interfaz más clara y directa.',
              },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.05)] backdrop-blur">
                <div className="mb-4 inline-flex rounded-2xl bg-cyan-50 p-3">
                  <Icon className="h-5 w-5 text-cyan-700" />
                </div>
                <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-50 p-3">
                  <Image
                    src="/images/LogoIcon.png"
                    alt="Planly"
                    width={28}
                    height={28}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-700">Planly</p>
                  <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">Inicia sesión</h2>
                </div>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right sm:block">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acceso</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">Empresas y partners</p>
              </div>
            </div>

            <p className="mb-8 text-sm leading-7 text-slate-600">
              Entra a tu espacio de gestión para publicar, organizar y responder con más agilidad.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Alert message={error} />

              <Input
                label="Usuario"
                icon={Mail}
                placeholder="Tu usuario empresarial"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                required
              />

              <Input
                label="Contraseña"
                type="password"
                icon={Lock}
                placeholder="Ingresa tu contraseña"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full rounded-2xl"
                size="lg"
              >
                Entrar al panel
              </Button>
            </form>

            <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                ¿Aún no tienes cuenta?
                <Link href="/register" className="ml-2 font-semibold text-cyan-700 transition hover:text-cyan-800">
                  Registra tu entidad
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
