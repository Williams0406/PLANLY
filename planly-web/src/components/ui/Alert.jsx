import { clsx } from 'clsx';

const variants = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-cyan-50 border-cyan-200 text-cyan-700',
};

export default function Alert({ message, variant = 'error' }) {
  if (!message) return null;
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-sm', variants[variant])}>
      {message}
    </div>
  );
}