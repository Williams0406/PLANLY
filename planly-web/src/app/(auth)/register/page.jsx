'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { authService } from '@/services/auth.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    tipo_usuario: 'entidad',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const nextErrors = {};

    if (!form.username || form.username.length < 3) {
      nextErrors.username = 'Mínimo 3 caracteres';
    }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = 'Email inválido';
    }
    if (!form.password || form.password.length < 6) {
      nextErrors.password = 'Mínimo 6 caracteres';
    }
    if (form.password !== form.password2) {
      nextErrors.password2 = 'Las contraseñas no coinciden';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await authService.register({ ...form, tipo_usuario: 'entidad' });
      router.push('/login?registered=true&tipo=entidad');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setErrors(fieldErrors);
      } else {
        setGlobalError('No pudimos crear la cuenta. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)] font-body text-slate-900">
      <FontStyle />

      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[1fr_1fr] lg:px-8">
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
                <Building2 className="h-3.5 w-3.5" />
                Registro empresarial
              </div>
              <h1 className="font-display mt-6 text-6xl font-extrabold leading-[0.95] tracking-tight text-slate-950">
                Crea tu cuenta
                <span className="block bg-gradient-to-r from-cyan-600 to-sky-500 bg-clip-text text-transparent">
                  como entidad.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Diseñamos este registro para empresas que quieren ofrecer servicios, gestionar su operación y crecer con una presencia más profesional en Planly.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Building2,
                title: 'Perfil de empresa',
                copy: 'Activa tu presencia comercial desde una base más ordenada.',
              },
              {
                icon: ShieldCheck,
                title: 'Validación clara',
                copy: 'El equipo revisa tu cuenta antes de publicar servicios.',
              },
              {
                icon: ArrowRight,
                title: 'Inicio rápido',
                copy: 'Regístrate y prepara tu panel para empezar a operar.',
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
                  <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">Registra tu entidad</h2>
                </div>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right sm:block">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cuenta</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">Solo entidades</p>
              </div>
            </div>

            <div className="mb-8 rounded-[24px] border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-sm leading-7 text-cyan-900">
                Este registro está enfocado en empresas y proveedores. Al crear tu cuenta, tu usuario se registrará directamente como entidad.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Alert message={globalError} />

              <Input
                label="Usuario"
                icon={User}
                placeholder="Elige tu usuario empresarial"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                error={errors.username}
                autoComplete="username"
                required
              />

              <Input
                label="Email"
                icon={Mail}
                type="email"
                placeholder="correo@tuempresa.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                error={errors.email}
                autoComplete="email"
                required
              />

              <Input
                label="Contraseña"
                type="password"
                icon={Lock}
                placeholder="Crea una contraseña segura"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                error={errors.password}
                autoComplete="new-password"
                required
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                icon={Lock}
                placeholder="Repite tu contraseña"
                value={form.password2}
                onChange={(e) => update('password2', e.target.value)}
                error={errors.password2}
                autoComplete="new-password"
                required
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full rounded-2xl"
                size="lg"
              >
                Crear cuenta empresarial
              </Button>
            </form>

            <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?
                <Link href="/login" className="ml-2 font-semibold text-cyan-700 transition hover:text-cyan-800">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
