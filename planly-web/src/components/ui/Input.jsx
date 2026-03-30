import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  className,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        ) : null}

        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={clsx(
            'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm',
            'transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-4',
            Icon && 'pl-12',
            isPassword && 'pr-12',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-cyan-400 focus:ring-cyan-100',
            className
          )}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
