import { clsx } from 'clsx';

const variants = {
  primary: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/25',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white',
  outline: 'border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  purple: 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm font-semibold',
  lg: 'px-6 py-3 text-base font-semibold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl',
        'transition-all duration-200 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}