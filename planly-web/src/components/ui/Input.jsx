import { clsx } from 'clsx';
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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={16} />
          </div>
        )}
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={clsx(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            Icon && 'pl-10',
            isPassword && 'pr-10',
            error
              ? 'border-red-300 focus:ring-red-200'
              : 'border-slate-200 focus:ring-cyan-200 focus:border-cyan-400',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}