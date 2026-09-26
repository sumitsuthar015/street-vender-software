import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Armchair, Banknote, Check, ChefHat, ChevronLeft, CreditCard, Receipt, ShieldCheck, ShoppingBag, Smile } from 'lucide-react';
import { FoodImage, StarInput, VegMark } from '../../components/food';
import { celebrate } from '../../components/motion';
import { ShopLogo } from '../../components/shop';
import { useToast } from '../../components/Toast';
import { Button, Card, ErrorState, Modal, PageLoader, cx, inputClass } from '../../components/ui';
import { api } from '../../lib/api';
import { clockTime, paymentLabel, rupees } from '../../lib/format';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { useSocket } from '../../lib/socket';
import { playDing } from '../../lib/sound';

const FINAL = ['completed', 'rejected', 'cancelled'];

const STEPS = [
  { status: 'placed', label: 'Placed', icon: Receipt },
  { status: 'preparing', label: 'Cooking', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: ShoppingBag },
  { status: 'completed', label: 'Enjoy', icon: Smile },
];

function Progress({ status }) {
  const current = STEPS.findIndex((s) => s.status === status);
  return (
    <div className="relative mt-6 px-2">
      {/* Track + animated fill behind the circles */}
      <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-gray-200" />
      <motion.div
        className="absolute left-[12.5%] top-5 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
        initial={false}
        animate={{ width: `${(Math.max(current, 0) / (STEPS.length - 1)) * 75}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <ol className="relative grid grid-cols-4">
        {STEPS.map((step, i) => {
          const done = i < current || status === 'completed';
          const active = i === current && status !== 'completed';
          const Icon = step.icon;
          return (
            <li key={step.status} className="flex flex-col items-center">
              <motion.span
                initial={false}
                animate={{ scale: active ? 1.12 : 1 }}
                className={cx(
                  'relative flex h-11 w-11 items-center justify-center rounded-full border-4 border-white shadow-soft transition-colors duration-500',
                  done ? 'bg-green-500 text-white' : active ? 'bg-gradient-to-br from-brand-500 to-rose-500 text-white' : 'bg-gray-100 text-gray-400'
                )}
              >
                {active && <span className="absolute inset-0 animate-ping rounded-full bg-brand-400 opacity-30" />}
                {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
              </motion.span>
              <p className={cx('mt-1.5 text-xs font-semibold', done || active ? 'text-gray-900' : 'text-gray-400')}>{step.label}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Big animated picture for each status. */
function StatusArt({ status }) {
  if (status === 'preparing') {
    return (
      <div className="relative flex h-20 w-20 items-end justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute top-0 h-6 w-1.5 animate-steam rounded-full bg-white/70 blur-[1px]"
            style={{ left: `${30 + i * 18}%`, animationDelay: `${i * 0.5}s` }}
          />
        ))}
        <span className="text-6xl">🍲</span>
      </div>
    );
  }
  const art = {
    awaiting_payment: { emoji: '💳', className: 'animate-wiggle' },
    placed: { emoji: '🧾', className: 'animate-float' },
    ready: { emoji: '🛍️', className: 'animate-bounce' },
    completed: { emoji: '😋', className: 'animate-float' },
    rejected: { emoji: '😔', className: '' },
    cancelled: { emoji: '🙅', className: '' },
  }[status];
  return <span className={cx('inline-block text-6xl', art.className)}>{art.emoji}</span>;
}

function StatusHero({ order }) {
  const minutesLeft = order.estimatedReadyAt ? Math.max(1, Math.round((new Date(order.estimatedReadyAt) - Date.now()) / 60000)) : null;
  const atTable = Boolean(order.table);

  const content = {
    awaiting_payment: {
      tone: 'from-amber-400 to-orange-500',
      title: 'Complete your payment',
      text: 'Your order goes to the shop as soon as the payment is done.',
    },
    placed: {
      tone: 'from-sky-500 to-indigo-500',
      title: 'Order sent!',
      text: 'Waiting for the shop to accept it. This page updates by itself.',
    },
    preparing: {
      tone: 'from-brand-500 to-rose-500',
      title: 'Cooking your food…',
      text: order.estimatedReadyAt ? `Ready by about ${clockTime(order.estimatedReadyAt)} (~${minutesLeft} min)` : 'It will be ready soon.',
    },
    ready: {
      tone: 'from-emerald-500 to-green-600',
      title: atTable ? 'Your food is coming!' : 'Your order is ready!',
      text: atTable
        ? `It's being brought to ${order.table.name}.${order.paymentStatus === 'pending' ? ` Pay ${rupees(order.total)} at the counter after eating.` : ''}`
        : order.paymentStatus === 'pending'
          ? `Go to the counter, show token #${order.token} and pay ${rupees(order.total)}.`
          : `Go to the counter and show token #${order.token}.`,
    },
    completed: {
      tone: 'from-violet-500 to-fuchsia-500',
      title: 'Enjoy your food!',
      text: 'Thanks for ordering. Tell others how it was below 👇',
    },
    rejected: {
      tone: 'from-gray-600 to-gray-800',
      title: "The shop couldn't accept your order",
      text: order.cancelReason,
    },
    cancelled: {
      tone: 'from-gray-600 to-gray-800',
      title: 'Order cancelled',
      text: order.cancelReason,
    },
  }[order.status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={order.status}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className={cx('relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-white shadow-lift', content.tone)}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <StatusArt status={order.status} />
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight">{content.title}</h1>
            {content.text && <p className="mt-1 text-sm text-white/90">{content.text}</p>}
          </div>
          {order.token && (
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }}
              className="shrink-0 rounded-2xl bg-white px-4 py-2 text-center text-gray-900 shadow-lift"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Token</p>
              <p className="font-display text-4xl font-extrabold leading-none">#{order.token}</p>
            </motion.div>
          )}
        </div>
        {atTable && (
          <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
            <Armchair className="h-4 w-4" /> {order.table.name}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** Fake payment screen shown when the server has no Razorpay keys (development). */
function DemoPaymentModal({ order, open, onClose, onPaid }) {
  const [paying, setPaying] = useState(false);
  const toast = useToast();

  const pay = async () => {
    setPaying(true);
    try {
      const data = await api.post(`/orders/${order.code}/pay/demo`);
      onPaid(data.order);
    } catch (err) {
      toast.error(err.message);
    }
    setPaying(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Online payment" size="sm">
      <div className="text-center">
        <p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">DEMO MODE · no real money</p>
        <p className="mt-4 text-sm text-gray-500">Paying {order.shop?.shopName}</p>
        <p className="font-display text-5xl font-extrabold text-gray-900">{rupees(order.total)}</p>
        <div className="mt-3 flex justify-center gap-2 text-2xl" aria-hidden>
          📱 💳 🏦
        </div>
        <p className="mt-3 text-xs text-gray-500">The shop hasn't connected Razorpay yet, so this screen pretends to be the payment gateway.</p>
      </div>
      <div className="mt-6 space-y-2">
        <Button size="lg" variant="success" className="w-full" loading={paying} onClick={pay}>
          <ShieldCheck className="h-5 w-5" /> Pay {rupees(order.total)} (success)
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          disabled={paying}
          onClick={() => {
            onClose();
            toast.error('Payment failed (demo). You can try again or pay at the counter.');
          }}
        >
          Simulate a failed payment
        </Button>
      </div>
    </Modal>
  );
}

function RateFood({ order, onDone }) {
  const toast = useToast();
  const pending = order.items.filter((l) => !l.reviewed);
  const [ratings, setRatings] = useState({}); // { itemId: { rating, comment } }
  const [saving, setSaving] = useState(false);

  if (!pending.length) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
          <p className="text-4xl">🙏</p>
          <p className="mt-2 font-display text-xl font-bold text-gray-900">Thanks for your rating!</p>
          <p className="mt-1 text-sm text-gray-500">It helps other customers pick the best dishes.</p>
        </Card>
      </motion.div>
    );
  }

  const set = (id, patch) => setRatings((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const chosen = Object.entries(ratings).filter(([, v]) => v.rating);

  const submit = async () => {
    setSaving(true);
    try {
      const data = await api.post(`/orders/${order.code}/reviews`, {
        reviews: chosen.map(([itemId, v]) => ({ itemId, rating: v.rating, comment: v.comment || '' })),
      });
      toast.success('Thanks for your feedback! ⭐');
      onDone(data.order);
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <Card className="p-5">
      <h2 className="font-display text-2xl font-extrabold text-gray-900">How was the food? 😋</h2>
      <p className="text-sm text-gray-500">Your rating shows on the menu for other customers.</p>
      <div className="mt-4 space-y-5">
        {pending.map((line, i) => {
          const id = String(line.item);
          return (
            <motion.div key={id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex items-center gap-2.5 font-semibold text-gray-900">
                <FoodImage name={line.name} className="h-9 w-9 rounded-xl" emojiClass="text-lg" />
                <VegMark isVeg={line.isVeg} /> {line.name}
              </div>
              <StarInput value={ratings[id]?.rating || 0} onChange={(rating) => set(id, { rating })} />
              <AnimatePresence>
                {ratings[id]?.rating > 0 && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={cx(inputClass, 'mt-1')}
                    placeholder="Add a comment (optional)"
                    maxLength={500}
                    value={ratings[id]?.comment || ''}
                    onChange={(e) => set(id, { comment: e.target.value })}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      <Button className="mt-5 w-full" disabled={!chosen.length} loading={saving} onClick={submit}>
        Submit rating
      </Button>
    </Card>
  );
}

export default function OrderPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const autoPayStarted = useRef(false);
  const lastStatus = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/orders/${code}`);
      setOrder(data.order);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates from the shop
  useSocket({
    onConnect: (socket) => {
      socket.emit('order:watch', code);
      load();
    },
    handlers: { 'order:changed': load },
  });

  // Backup refresh every 30s in case the live connection drops
  useEffect(() => {
    if (!order || FINAL.includes(order.status)) return undefined;
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [order, load]);

  // Confetti + ding + buzz when the food becomes ready
  useEffect(() => {
    if (!order) return;
    if (lastStatus.current && lastStatus.current !== order.status) {
      if (order.status === 'ready') {
        playDing();
        navigator.vibrate?.([300, 150, 300]);
        celebrate();
      } else if (order.status === 'placed' && lastStatus.current === 'awaiting_payment') {
        celebrate();
      }
    }
    lastStatus.current = order.status;
    document.title = order.token ? `#${order.token} ${order.status === 'ready' ? 'READY' : 'Your order'}` : 'Your order';
  }, [order]);

  const startPayment = useCallback(async () => {
    setPaying(true);
    try {
      const { payment } = await api.post(`/orders/${code}/pay`);
      if (payment.mode === 'demo') {
        setDemoOpen(true);
      } else {
        const result = await openRazorpayCheckout({
          payment,
          shopName: order.shop?.shopName || 'Food order',
          customerName: order.customerName,
          customerPhone: order.customerPhone,
        });
        const data = await api.post(`/orders/${code}/pay/verify`, result);
        setOrder(data.order);
        toast.success('Payment successful! Your order is sent to the shop.');
      }
    } catch (err) {
      toast.error(err.message);
      load();
    }
    setPaying(false);
  }, [code, order, toast, load]);

  // Coming straight from checkout with "Pay online": open the payment right away
  useEffect(() => {
    if (order?.status === 'awaiting_payment' && location.state?.startPayment && !autoPayStarted.current) {
      autoPayStarted.current = true;
      navigate(location.pathname, { replace: true, state: null });
      startPayment();
    }
  }, [order, location, navigate, startPayment]);

  const action = async (name, path, successMessage) => {
    setBusy(name);
    try {
      const data = await api.post(`/orders/${code}/${path}`);
      setOrder(data.order);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
      load();
    }
    setBusy('');
  };

  if (error && !order) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <PageLoader />;

  const shop = order.shop;
  const canCancel = ['awaiting_payment', 'placed'].includes(order.status);
  const menuUrl = shop ? `/s/${shop.slug}${order.table ? `?table=${order.table.code}` : ''}` : '/';

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-10">
      <header className="flex items-center gap-3 py-4">
        {shop && (
          <Link to={menuUrl} className="-ml-2 rounded-full p-2 text-gray-600 transition hover:bg-white" aria-label="Back to menu">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        {shop && <ShopLogo src={shop.logoUrl} name={shop.shopName} className="h-10 w-10 border-2 text-sm" />}
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{shop?.shopName}</p>
          <p className="text-xs text-gray-500">
            Ordered at {clockTime(order.createdAt)} by {order.customerName}
          </p>
        </div>
      </header>

      <StatusHero order={order} />
      {!['awaiting_payment', 'rejected', 'cancelled'].includes(order.status) && <Progress status={order.status} />}

      {/* Payment needed */}
      {order.status === 'awaiting_payment' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-2">
          <Button size="lg" className="w-full" loading={paying} onClick={startPayment}>
            <CreditCard className="h-5 w-5" /> Pay {rupees(order.total)} online
          </Button>
          {shop?.payments.counter && (
            <Button
              variant="secondary"
              className="w-full"
              loading={busy === 'counter'}
              disabled={paying}
              onClick={() => action('counter', 'switch-to-counter', 'Order sent! Pay at the counter.')}
            >
              <Banknote className="h-4 w-4" /> Pay at counter instead
            </Button>
          )}
        </motion.div>
      )}

      {order.status === 'completed' && (
        <div className="mt-6">
          <RateFood order={order} onDone={setOrder} />
        </div>
      )}

      {/* Bill */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-dashed border-gray-200 bg-gray-50 px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Your bill</h2>
          <span className="font-mono text-xs text-gray-400">#{order.code}</span>
        </div>
        <ul className="space-y-3 px-5 pt-4">
          {order.items.map((line) => (
            <li key={String(line.item)} className="flex items-center gap-3 text-sm">
              <FoodImage name={line.name} className="h-9 w-9 rounded-xl" emojiClass="text-lg" />
              <VegMark isVeg={line.isVeg} />
              <span className="flex-1 text-gray-800">
                {line.name} <span className="text-gray-400">× {line.qty}</span>
              </span>
              <span className="font-medium text-gray-900">{rupees(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        {order.note && <p className="mx-5 mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">📝 {order.note}</p>}
        <div className="mx-5 mt-4 flex items-center justify-between border-t border-gray-100 py-3">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-display text-2xl font-extrabold text-gray-900">{rupees(order.total)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 bg-gray-50 px-5 py-3">
          <span className={cx('inline-flex items-center gap-1.5 text-sm font-semibold', order.paymentStatus === 'paid' ? 'text-green-700' : 'text-gray-600')}>
            {order.paymentStatus === 'paid' && <Check className="h-4 w-4" />}
            {paymentLabel(order)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
            {order.table ? <Armchair className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            {order.table ? order.table.name : 'Pickup'}
          </span>
        </div>
        {order.paymentStatus === 'refunded' && order.payment?.provider !== 'cash' && (
          <p className="px-5 pb-3 text-xs text-gray-500">The money goes back to your account in 5-7 working days.</p>
        )}
      </Card>

      <div className="mt-6 space-y-3 text-center">
        {canCancel && (
          <button
            className="text-sm font-semibold text-red-600 disabled:opacity-50"
            disabled={busy === 'cancel' || paying}
            onClick={() => {
              if (window.confirm('Cancel this order?')) action('cancel', 'cancel', 'Order cancelled');
            }}
          >
            {busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}
          </button>
        )}
        {shop && (
          <p>
            <Link to={menuUrl} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-soft transition hover:-translate-y-0.5">
              {FINAL.includes(order.status) ? '🍽️ Order again' : '← Back to menu'}
            </Link>
          </p>
        )}
        {!FINAL.includes(order.status) && (
          <p className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="relative h-2 w-2 rounded-full bg-green-500">
              <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-60" />
            </span>
            Live: keep this page open, it updates automatically
          </p>
        )}
      </div>

      <DemoPaymentModal
        order={order}
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onPaid={(updated) => {
          setDemoOpen(false);
          setOrder(updated);
          toast.success('Payment successful! Your order is sent to the shop.');
        }}
      />
    </div>
  );
}
