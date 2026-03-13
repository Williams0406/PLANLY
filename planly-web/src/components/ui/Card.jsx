import { clsx } from 'clsx';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-slate-100',
        'shadow-sm shadow-slate-200/50',
        hover && 'hover:shadow-md hover:border-slate-200 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}