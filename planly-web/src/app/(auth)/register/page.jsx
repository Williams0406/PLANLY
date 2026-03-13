'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Building2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { clsx } from 'clsx';

const TIPOS = [
  {
    value: 'persona',
    emoji: '👤',
    label: 'Cliente',
    desc: 'Quiero contratar y disfrutar servicios',
    color: 'cyan',
  },
  {
    value: 'entidad',
    emoji: '🏢',
    label: 'Proveedor',
    desc: 'Quiero ofrecer y gestionar servicios',
    color: 'violet',
  },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    tipo_usuario: 'persona',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 3)
      e.username = 'Mínimo 3 caracteres';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Email inválido';
    if (!form.password || form.password.length < 6)
      e.password = 'Mínimo 6 caracteres';
    if (form.password !== form.password2)
      e.password2 = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.register(form);
      router.push(`/login?registered=true&tipo=${form.tipo_usuario}`);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v;
        });
        setErrors(fieldErrors);
      } else {
        setGlobalError('Error al registrar. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedTipo = TIPOS.find((t) => t.value === form.tipo_usuario);
  const accentColor = selectedTipo?.color === 'violet' ? 'violet' : 'cyan';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-cyan-500/30">
            <span className="text-3xl">🗺️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="text-slate-400 mt-1">Únete a Planly</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Alert message={globalError} />

            {/* Selector tipo */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                ¿Cómo usarás Planly?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS.map((tipo) => (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => update('tipo_usuario', tipo.value)}
                    className={clsx(
                      'flex flex-col items-center p-4 rounded-2xl border-2 transition-all text-left',
                      form.tipo_usuario === tipo.value
                        ? tipo.color === 'violet'
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-cyan-500 bg-cyan-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-2xl mb-1">{tipo.emoji}</span>
                    <span className={clsx(
                      'text-sm font-bold',
                      form.tipo_usuario === tipo.value
                        ? tipo.color === 'violet' ? 'text-violet-700' : 'text-cyan-700'
                        : 'text-slate-700'
                    )}>
                      {tipo.label}
                    </span>
                    <span className="text-xs text-slate-500 text-center mt-0.5 leading-tight">
                      {tipo.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Nombre de usuario"
              icon={User}
              placeholder="ej: juan_viajero"
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              error={errors.username}
            />

            <Input
              label="Email"
              icon={Mail}
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={errors.email}
            />

            <Input
              label="Contraseña"
              type="password"
              icon={Lock}
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              icon={Lock}
              placeholder="Repite tu contraseña"
              value={form.password2}
              onChange={(e) => update('password2', e.target.value)}
              error={errors.password2}
            />

            {form.tipo_usuario === 'entidad' && (
              <div className="flex gap-2 p-3 bg-violet-50 rounded-xl border border-violet-200">
                <Building2 size={16} className="text-violet-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-violet-700 leading-relaxed">
                  Tu cuenta será verificada por nuestro equipo antes de poder publicar servicios. El proceso toma 24-48 horas.
                </p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
              variant={form.tipo_usuario === 'entidad' ? 'purple' : 'primary'}
            >
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-cyan-600 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}