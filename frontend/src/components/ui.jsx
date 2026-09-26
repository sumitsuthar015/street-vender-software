import { useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const BUTTON_VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow hover:from-brand-600 hover:to-brand-700 disabled:from-brand-300 disabled:to-brand-300 disabled:shadow-none',
  secondary: 'bg-white text-gray-800 border border-gray-200 shadow-soft hover:border-gray-300 hover:bg-gray-50 disabled:text-gray-400',
  success:
    'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_10px_30px_-10px_rgba(22,163,74,0.6)] hover:from-emerald-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-300',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:text-red-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  dark: 'bg-gray-900 text-white shadow-lift hover:bg-gray-800 disabled:bg-gray-400',
  ghost: 'text-gray-600 hover:bg-gray-100 disabled:text-gray-300',
};

const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150',
        'active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:active:scale-100',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, className }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {typeof children === 'function' ? children(id) : children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm transition ' +
  'placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 sm:text-sm';

export function Input({ label, hint, error, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => <input id={id} className={inputClass} {...props} />}
    </Field>
  );
}

export function Textarea({ label, hint, className, rows = 3, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => <textarea id={id} rows={rows} className={cx(inputClass, 'resize-none')} {...props} />}
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description, disabled, ariaLabel }) {
  return (
    <label className={cx('flex items-center justify-between gap-4', disabled ? 'opacity-60' : 'cursor-pointer')}>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-gray-900">{label}</span>}
          {description && <span className="block text-xs text-gray-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          checked ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gray-300'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')}
        />
      </button>
    </label>
  );
}

/** Bottom sheet on phones, centered dialog on bigger screens. Slides/fades in and out. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cx(
              'relative flex max-h-[92vh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl sm:rounded-3xl',
              size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg'
            )}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <h2 className="font-display text-xl font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 transition hover:rotate-90 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="border-t border-gray-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cx('animate-spin text-brand-600', className || 'h-6 w-6')} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <span className="animate-bounce text-4xl" aria-hidden>🍛</span>
      <Spinner className="h-6 w-6" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-5xl" aria-hidden>😕</p>
      <p className="mt-3 text-gray-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, emoji, title, text, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 px-6 py-12 text-center"
    >
      {emoji ? (
        <p className="animate-float text-5xl" aria-hidden>
          {emoji}
        </p>
      ) : (
        Icon && <Icon className="mx-auto h-10 w-10 text-gray-300" />
      )}
      <h3 className="mt-3 font-display text-xl font-bold text-gray-900">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function Badge({ className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }) {
  return <div className={cx('rounded-3xl border border-gray-100 bg-white shadow-soft', className)}>{children}</div>;
}

/** Page title with an optional subtitle and action on the right. */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-extrabold leading-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export { cx };
