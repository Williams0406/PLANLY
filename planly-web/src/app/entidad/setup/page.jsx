'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FileBadge2, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { entidadService } from '@/services/entidad.service';
import { getAuthenticatedHome } from '@/lib/auth-routing';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

const INITIAL_FORM = {
  nombre_comercial: '',
  ruc: '',
  direccion: '',
  contacto_referencia: '',
};

export default function EntidadSetupPage() {
  const router = useRouter();
  const { init, isAuthenticated, isLoading, user } = useAuthStore();
  const [perfilId, setPerfilId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [saving, setSaving] = useState(false);

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
      if (target !== '/entidad/setup') {
        router.push(target);
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    if (!isAuthenticated || user?.tipo_usuario !== 'entidad') {
      setLoadingPerfil(false);
      return;
    }

    const loadPerfil = async () => {
      try {
        const perfil = await entidadService.getPerfil();
        if (perfil) {
          setPerfilId(perfil.id);
          setForm({
            nombre_comercial: perfil.nombre_comercial || '',
            ruc: perfil.ruc || '',
            direccion: perfil.direccion || '',
            contacto_referencia: perfil.contacto_referencia || '',
          });
        }
      } catch {
        setGlobalError('No pudimos cargar tu perfil de entidad. Intenta nuevamente.');
      } finally {
        setLoadingPerfil(false);
      }
    };

    loadPerfil();
  }, [isAuthenticated, user]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const nextErrors = {};
    if (!form.nombre_comercial.trim()) nextErrors.nombre_comercial = 'Requerido';
    if (!form.direccion.trim()) nextErrors.direccion = 'Requerido';
    if (!form.contacto_referencia.trim()) nextErrors.contacto_referencia = 'Requerido';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGlobalError('');
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        nombre_comercial: form.nombre_comercial.trim(),
        ruc: form.ruc.trim(),
        direccion: form.direccion.trim(),
        contacto_referencia: form.contacto_referencia.trim(),
      };

      if (perfilId) {
        await entidadService.updatePerfil(perfilId, payload);
      } else {
        await entidadService.createPerfil(payload);
      }

      await init();
      router.push('/entidad/pendiente');
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setErrors(fieldErrors);
      } else {
        setGlobalError('No pudimos guardar tu perfil empresarial.');
      }
    } finally {
      setSaving(false);
    }
  };

  const pageLoading = isLoading || loadingPerfil;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,#07111F_0%,#0B1626_100%)] font-body text-white">
      <FontStyle />

      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[1fr_1fr] lg:px-8">
        <section className="hidden lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Volver a Planly
            </Link>

            <div className="mt-12 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Onboarding empresarial
              </div>
              <h1 className="font-display mt-6 text-6xl font-extrabold leading-[0.95] tracking-tight text-white">
                Completa tu perfil
                <span className="block bg-gradient-to-r from-cyan-300 to-sky-500 bg-clip-text text-transparent">
                  y envia tu solicitud.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Este paso nos ayuda a validar tu negocio y desbloquear el panel de gestion para publicar servicios.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Building2,
                title: 'Datos claros',
                copy: 'Nombre comercial, contacto y direccion listos para revisar.',
              },
              {
                icon: FileBadge2,
                title: 'Validacion simple',
                copy: 'El equipo valida tu perfil y activa el acceso comercial.',
              },
              {
                icon: ShieldCheck,
                title: 'Acceso ordenado',
                copy: 'Solo las entidades aprobadas publican dentro del dashboard.',
              },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <div className="mb-4 inline-flex rounded-2xl bg-cyan-500/10 p-3">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <h2 className="text-base font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0B1626]/90 p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)] backdrop-blur sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">Planly Business</p>
              <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white">
                Perfil de entidad
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Completa los datos principales de tu empresa para enviar la solicitud de aprobacion.
              </p>
            </div>

            {pageLoading ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-10 text-center">
                <div className="mx-auto h-10 w-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                <p className="mt-4 text-sm text-slate-400">Preparando tu onboarding...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Alert message={globalError} />

                <Input
                  label="Nombre comercial"
                  icon={Building2}
                  placeholder="Ej. Andes Travel Studio"
                  value={form.nombre_comercial}
                  onChange={(event) => update('nombre_comercial', event.target.value)}
                  error={errors.nombre_comercial}
                  required
                />

                <Input
                  label="RUC"
                  icon={FileBadge2}
                  placeholder="Opcional"
                  value={form.ruc}
                  onChange={(event) => update('ruc', event.target.value)}
                  error={errors.ruc}
                />

                <Input
                  label="Direccion"
                  icon={MapPin}
                  placeholder="Ej. Av. Larco 123, Miraflores"
                  value={form.direccion}
                  onChange={(event) => update('direccion', event.target.value)}
                  error={errors.direccion}
                  required
                />

                <Input
                  label="Contacto de referencia"
                  icon={Phone}
                  placeholder="Nombre, WhatsApp o telefono"
                  value={form.contacto_referencia}
                  onChange={(event) => update('contacto_referencia', event.target.value)}
                  error={errors.contacto_referencia}
                  required
                />

                <Button type="submit" loading={saving} size="lg" className="w-full rounded-2xl">
                  {perfilId ? 'Actualizar y enviar revision' : 'Enviar perfil para revision'}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
