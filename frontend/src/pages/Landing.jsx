import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  CreditCard,
  LayoutGrid,
  QrCode,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Logo from '../components/Logo';
import { FoodImage, VegMark } from '../components/food';
import { Reveal } from '../components/motion';
import { useAuth } from '../lib/auth';
import { APP_NAME } from '../lib/format';

const MARQUEE = ['🥟 Pani Puri', '☕ Masala Chai', '🌯 Kathi Rolls', '🍜 Hakka Noodles', '🍔 Vada Pav', '🫓 Dosa', '🍗 Tikka', '🥤 Lassi', '🍛 Biryani', '🍨 Kulfi', '🌽 Bhutta', '🥪 Bombay Sandwich'];

const STEPS = [
  { emoji: '📝', title: 'Add your menu', text: 'Dishes, prices and photos from your phone. Mark items sold out with one tap.' },
  { emoji: '🖨️', title: 'Print your QR poster', text: 'A ready-made poster with your stall photo. One for the counter, one per table.' },
  { emoji: '🔔', title: 'Orders ring on your phone', text: 'Cook, tap "Ready", and the customer\'s phone buzzes. No shouting needed.' },
];

const FEATURES = [
  { icon: QrCode, color: 'from-brand-500 to-rose-500', title: 'QR menu', text: 'Customers scan and see your full menu with photos. No app to download.' },
  { icon: LayoutGrid, color: 'from-violet-500 to-fuchsia-500', title: 'Table-wise QR', text: 'Every table gets its own QR, so you know exactly where to serve.' },
  { icon: BellRing, color: 'from-sky-500 to-indigo-500', title: 'Live orders', text: 'New orders ring instantly with a token number. Accept, cook, done.' },
  { icon: CreditCard, color: 'from-emerald-500 to-green-600', title: 'Cash or online', text: 'UPI & cards through Razorpay, or pay at the counter. Customer\'s choice.' },
  { icon: Star, color: 'from-amber-400 to-orange-500', title: 'Ratings & reviews', text: 'Customers rate each dish. Top rated food gets a badge on your menu.' },
  { icon: BarChart3, color: 'from-rose-500 to-pink-500', title: 'Sales dashboard', text: 'Today\'s earnings, best sellers and cash to collect, at a glance.' },
];

const DEMO_DISHES = [
  { name: 'Pani Puri', price: 40, rating: '4.8', veg: true },
  { name: 'Paneer Kathi Roll', price: 120, rating: '4.6', veg: true },
  { name: 'Masala Chai', price: 20, rating: '4.9', veg: true },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[270px] rounded-[2.6rem] border-[10px] border-gray-900 bg-white shadow-2xl sm:w-[290px]">
      <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-gray-900" />
      <div className="overflow-hidden rounded-[2rem]">
        <div className="relative h-28 bg-gradient-to-br from-brand-500 via-rose-500 to-amber-400">
          <div className="absolute inset-0 grid grid-cols-5 place-items-center text-xl opacity-25">
            {['🥟', '🌶️', '☕', '🍛', '🌯', '🥤', '🍢', '🍋', '🫓', '🍜'].map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
          <div className="absolute bottom-3 left-4 text-white">
            <p className="font-display text-xl font-extrabold leading-none">Sharma Chaat</p>
            <p className="mt-1 text-[10px] opacity-90">⭐ 4.8 · Open till 11 PM</p>
          </div>
        </div>
        <div className="space-y-3 p-3">
          {DEMO_DISHES.map((dish, i) => (
            <motion.div
              key={dish.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="flex items-center gap-2.5"
            >
              <FoodImage name={dish.name} className="h-12 w-12 rounded-xl" emojiClass="text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-xs font-semibold">
                  <VegMark isVeg={dish.veg} className="h-3 w-3" /> {dish.name}
                </p>
                <p className="text-[11px] text-gray-500">
                  ₹{dish.price} · <span className="font-semibold text-green-600">★ {dish.rating}</span>
                </p>
              </div>
              <span className="rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-extrabold text-green-700">ADD</span>
            </motion.div>
          ))}
        </div>
        <div className="p-3 pt-1">
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2.5 text-white">
            <span className="text-[11px] font-bold">3 items · ₹180</span>
            <span className="flex items-center gap-1 text-[11px] font-bold">
              <ShoppingBag className="h-3 w-3" /> View cart
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-6"
    >
      <PhoneMockup />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, type: 'spring' }}
        className="absolute -left-2 top-12 sm:-left-10"
      >
        <div className="glass animate-float flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-lift">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-lg">🔔</span>
          <div>
            <p className="text-xs font-bold text-gray-900">New order #12</p>
            <p className="text-[11px] text-gray-500">Table 4 · ₹240 · Paid</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, type: 'spring' }}
        className="absolute -right-1 top-1/3 sm:-right-8"
      >
        <div className="glass animate-float-slow rounded-2xl p-2.5 shadow-lift [animation-delay:1s]">
          <QRCodeSVG value={`${window.location.origin}/register`} size={72} fgColor="#1c1917" bgColor="transparent" />
          <p className="mt-1 text-center text-[10px] font-bold tracking-wider text-gray-700">SCAN ME</p>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.7, type: 'spring' }}
        className="absolute -left-1 bottom-10 sm:-left-12"
      >
        <div className="glass animate-float rounded-2xl px-3.5 py-2.5 shadow-lift [animation-delay:2s]">
          <p className="text-xs font-bold text-amber-500">★★★★★</p>
          <p className="text-[11px] font-medium text-gray-700">"Best pani puri in town!"</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const TRACK_STEPS = [
  { emoji: '🧾', title: 'Order sent', text: 'Waiting for the shop…', color: 'from-sky-500 to-indigo-500' },
  { emoji: '👨‍🍳', title: 'Preparing', text: 'Ready in about 8 min', color: 'from-brand-500 to-rose-500' },
  { emoji: '🛍️', title: 'Ready!', text: 'Show token #12 at the counter', color: 'from-emerald-500 to-green-600' },
];

/** Little looping animation of what customers see while they wait. */
function TrackingDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % TRACK_STEPS.length), 2200);
    return () => clearInterval(timer);
  }, []);
  const current = TRACK_STEPS[step];

  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-lift ring-1 ring-black/5">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl bg-gradient-to-br ${current.color} p-5 text-white`}
      >
        <div className="flex items-start justify-between">
          <div>
            <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-4xl">
              {current.emoji}
            </motion.p>
            <p className="mt-2 font-display text-2xl font-extrabold">{current.title}</p>
            <p className="text-sm opacity-90">{current.text}</p>
          </div>
          <div className="rounded-2xl bg-white/90 px-3 py-1.5 text-center text-gray-900">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Token</p>
            <p className="font-display text-2xl font-extrabold leading-none">#12</p>
          </div>
        </div>
      </motion.div>
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {TRACK_STEPS.map((s, i) => (
          <div key={s.title} className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <motion.div className="h-full bg-green-500" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { vendor } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf5]">
      {/* Nav */}
      <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            {vendor ? (
              <Link to="/dashboard" className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white">
                  Log in
                </Link>
                <Link to="/register" className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-24 top-10 h-72 w-72 animate-blob rounded-full bg-brand-300/40 blur-3xl" />
          <div className="absolute right-0 top-40 h-80 w-80 animate-blob rounded-full bg-rose-300/40 blur-3xl [animation-delay:3s]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-blob rounded-full bg-amber-200/50 blur-3xl [animation-delay:6s]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-sm font-semibold text-brand-700 shadow-sm"
            >
              <span className="animate-wiggle">🔥</span> For stalls, carts, dhabas & food trucks
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-5 font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
            >
              Your stall's menu
              <br />
              on a <span className="text-gradient animate-gradient-x">QR code.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-5 max-w-xl text-lg text-gray-600"
            >
              Customers scan, order and pay from their own phone. You get every order live with a token number, and they
              get a buzz when it's ready.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-rose-500 px-6 py-3.5 font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
              >
                Register your stall, it's free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="rounded-2xl border border-gray-200 bg-white px-6 py-3.5 font-semibold text-gray-800 shadow-soft transition hover:-translate-y-0.5">
                Vendor login
              </Link>
            </motion.div>
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-gray-600"
            >
              {['No app for customers', 'Cash or UPI', 'Table-wise QR', 'Live order status'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-3 w-3 text-green-700" />
                  </span>
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Food marquee */}
      <div className="relative -rotate-1 overflow-hidden bg-gray-900 py-3.5 text-white">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-xl font-bold">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="flex items-center gap-8">
              {item}
              <span className="text-brand-400">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How it works</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold text-gray-900">Start taking orders in 10 minutes</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.12}>
              <div className="group relative h-full rounded-3xl border border-gray-100 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="absolute right-5 top-4 font-display text-6xl font-extrabold text-gray-100 transition group-hover:text-brand-100">
                  {i + 1}
                </span>
                <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-3xl transition group-hover:scale-110 group-hover:rotate-6">
                  {step.emoji}
                </span>
                <h3 className="relative mt-4 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="relative mt-1 text-sm text-gray-600">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Everything you need</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold text-gray-900">Made for busy street food stalls</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.1}>
                <div className="group h-full rounded-3xl border border-gray-100 bg-[#fffaf5] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lift">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg transition group-hover:scale-110`}>
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tracking showcase */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">For your customers</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold text-gray-900">No more "bhaiya, mera order?"</h2>
          <p className="mt-4 text-gray-600">
            After ordering, customers watch their order live on their phone: sent, preparing, ready. Their phone buzzes when
            the food is ready, and they can rate every dish afterwards.
          </p>
          <ul className="mt-6 space-y-3">
            {['Token number for every order', 'Ready time estimate', 'Confetti when food is ready 🎉'].map((t) => (
              <li key={t} className="flex items-center gap-3 font-medium text-gray-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-rose-500 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.15}>
          <TrackingDemo />
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-brand-600 via-rose-500 to-amber-500 bg-[length:200%_200%] p-10 text-center text-white animate-gradient-x sm:p-16">
            <div className="pointer-events-none absolute inset-0 grid grid-cols-8 place-items-center text-3xl opacity-15" aria-hidden>
              {Array.from({ length: 24 }, (_, i) => (
                <span key={i}>{['🥟', '🌯', '☕', '🍛'][i % 4]}</span>
              ))}
            </div>
            <UtensilsCrossed className="relative mx-auto h-10 w-10" />
            <h2 className="relative mt-4 font-display text-4xl font-extrabold sm:text-5xl">Ready for more orders?</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/90">Set up your stall in minutes. Free to start, works on any phone.</p>
            <Link
              to="/register"
              className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-bold text-brand-700 shadow-lift transition hover:-translate-y-0.5"
            >
              Register your stall <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-gray-500 sm:px-6">
          <Logo />
          <p>
            © {new Date().getFullYear()} {APP_NAME} · Made with ❤️ for street food
          </p>
        </div>
      </footer>
    </div>
  );
}
