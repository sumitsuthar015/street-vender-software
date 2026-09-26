import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { Button, Field, Input, inputClass } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const FLOATING = [
  { emoji: '🥟', className: 'left-[12%] top-[18%] text-5xl' },
  { emoji: '☕', className: 'right-[14%] top-[26%] text-4xl [animation-delay:1s]' },
  { emoji: '🌯', className: 'left-[20%] bottom-[22%] text-4xl [animation-delay:2s]' },
  { emoji: '🍛', className: 'right-[18%] bottom-[14%] text-5xl [animation-delay:3s]' },
];

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-rose-500 to-amber-500 bg-[length:200%_200%] animate-gradient-x lg:flex lg:flex-col lg:justify-between lg:p-12">
      {FLOATING.map((f) => (
        <span key={f.emoji} className={`absolute animate-float opacity-80 drop-shadow-lg ${f.className}`} aria-hidden>
          {f.emoji}
        </span>
      ))}
      <Logo light />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative text-white">
        <h2 className="font-display text-5xl font-extrabold leading-tight">
          Run your stall
          <br />
          the smart way.
        </h2>
        <ul className="mt-6 space-y-3 text-lg text-white/90">
          {['QR menu with your photos', 'Orders ring on your phone', 'Cash or online payments', 'Ratings that bring more customers'].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                <Check className="h-3.5 w-3.5" />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </motion.div>
      <p className="relative text-sm text-white/80">Trusted by chaat corners, chai stalls & momo carts.</p>
    </div>
  );
}

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <div className="relative flex flex-col items-center justify-center px-4 py-10">
        {/* Phone: small gradient header instead of the side panel */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-brand-500 via-rose-500 to-amber-400 lg:hidden" />
        <div className="relative lg:hidden">
          <Logo light />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-8 w-full max-w-md rounded-[2rem] bg-white p-6 shadow-lift ring-1 ring-black/5 sm:p-8 lg:mt-0"
        >
          <h1 className="font-display text-3xl font-extrabold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </motion.div>
        <p className="relative mt-6 text-sm text-gray-600">{footer}</p>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, autoComplete, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="relative">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            className={`${inputClass} pr-11`}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            required
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
    </Field>
  );
}

function useAuthForm(path, initial) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const bind = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post(path, form);
      login(data.token, data.vendor);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  return { bind, submit, error, loading };
}

export function Login() {
  const { bind, submit, error, loading } = useAuthForm('/auth/login', { email: '', password: '' });
  return (
    <AuthLayout
      title="Welcome back 👋"
      subtitle="Log in to your vendor dashboard."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Register your stall
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" required {...bind('email')} />
        <PasswordInput label="Password" autoComplete="current-password" {...bind('password')} />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const { bind, submit, error, loading } = useAuthForm('/auth/register', {
    name: '',
    shopName: '',
    email: '',
    phone: '',
    password: '',
  });
  return (
    <AuthLayout
      title="Register your stall 🍽️"
      subtitle="Takes 1 minute. You can change everything later."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label="Shop / stall name" placeholder="e.g. Sharma Chaat Corner" required {...bind('shopName')} />
        <Input label="Your name" autoComplete="name" required {...bind('name')} />
        <Input label="Email" type="email" autoComplete="email" required {...bind('email')} />
        <Input
          label="Phone number (optional)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint="Shown to customers so they can call you"
          {...bind('phone')}
        />
        <PasswordInput label="Password" autoComplete="new-password" hint="At least 6 characters" {...bind('password')} />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
