import { clsx } from 'clsx';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  purple: 'bg-violet-50 text-violet-700 border border-violet-200',
  gray: 'bg-slate-50 text-slate-600 border border-slate-200',
};

export default function Badge({ children, variant = 'info', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}