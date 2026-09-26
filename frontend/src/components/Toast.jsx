import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLORS = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-brand-300' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((type, message, duration = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, type, message }].slice(-3));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg) => show('success', msg),
      error: (msg) => show('error', msg, 5000),
      info: (msg) => show('info', msg, 5000),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-gray-900/95 px-4 py-3 text-sm text-white shadow-lift backdrop-blur"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${COLORS[t.type]}`} />
                <span>{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
