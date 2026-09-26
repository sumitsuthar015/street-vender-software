import { forwardRef, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Armchair, Banknote, ChefHat, CheckCircle2, Clock, CreditCard, Phone, ShoppingBag, XCircle } from 'lucide-react';
import { FoodImage, StatusBadge, VegMark } from '../../components/food';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, EmptyState, ErrorState, Modal, PageHeader, PageLoader, Textarea, cx } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { clockTime, dateTime, itemCount, paymentLabel, rupees, timeAgo } from '../../lib/format';
import { useDashboard } from './DashboardLayout';

const COLUMNS = [
  { status: 'placed', title: 'New orders', empty: 'No new orders', emoji: '🔔', tint: 'bg-sky-100 text-sky-700' },
  { status: 'preparing', title: 'Preparing', empty: 'Nothing cooking', emoji: '👨‍🍳', tint: 'bg-brand-100 text-brand-700' },
  { status: 'ready', title: 'Ready', empty: 'Nothing waiting', emoji: '✅', tint: 'bg-green-100 text-green-700' },
];

const REJECT_REASONS = ['Item sold out', 'Too many orders right now', 'Closing the shop now'];

function PaymentBadge({ order }) {
  const paid = order.paymentStatus === 'paid';
  const Icon = order.paymentMethod === 'online' ? CreditCard : Banknote;
  return (
    <Badge className={paid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}>
      <Icon className="h-3.5 w-3.5" />
      {paymentLabel(order)}
    </Badge>
  );
}

/** Dine-in orders show the table; the rest are pickup at the counter. */
function WhereBadge({ order, large }) {
  if (!order.table) {
    return (
      <span className={cx('inline-flex items-center gap-1 rounded-lg bg-gray-100 font-semibold text-gray-600', large ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[11px]')}>
        <ShoppingBag className="h-3 w-3" /> Pickup
      </span>
    );
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 font-bold text-white shadow-sm',
        large ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-[11px]'
      )}
    >
      <Armchair className={large ? 'h-4 w-4' : 'h-3 w-3'} /> {order.table.name}
    </span>
  );
}

// forwardRef: AnimatePresence's "popLayout" mode needs a ref to animate cards out smoothly
const OrderCard = forwardRef(function OrderCard({ order, onAction, busy }, ref) {
  const cashDue = order.paymentStatus === 'pending';
  const atTable = Boolean(order.table);
  return (
    <motion.div
      ref={ref}
      layout
      layoutId={order.id}
      initial={{ opacity: 0, scale: 0.9, y: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
    >
      <Card className={cx('overflow-hidden', order.status === 'placed' && 'animate-glow ring-2 ring-sky-400')}>
        <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-gray-50 to-white p-4 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display text-3xl font-extrabold leading-none text-gray-900">#{order.token}</p>
              <WhereBadge order={order} large />
            </div>
            <p className="mt-2 truncate font-semibold text-gray-800">{order.customerName}</p>
            {order.customerPhone && (
              <a href={`tel:${order.customerPhone}`} className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                <Phone className="h-3.5 w-3.5" />
                {order.customerPhone}
              </a>
            )}
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-gray-700">{timeAgo(order.createdAt)}</p>
            <p>{clockTime(order.createdAt)}</p>
          </div>
        </div>

        <div className="px-4">
          <ul className="space-y-2 border-t border-dashed border-gray-200 pt-3">
            {order.items.map((line) => (
              <li key={String(line.item)} className="flex items-center gap-2.5 text-sm">
                <FoodImage name={line.name} className="h-8 w-8 rounded-lg" emojiClass="text-base" />
                <VegMark isVeg={line.isVeg} />
                <span className="font-bold text-gray-900">{line.qty}×</span>
                <span className="flex-1 text-gray-800">{line.name}</span>
                <span className="text-gray-500">{rupees(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          {order.note && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              📝 <span className="font-semibold">Note:</span> {order.note}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <span className="text-xl font-bold text-gray-900">{rupees(order.total)}</span>
            <PaymentBadge order={order} />
          </div>

          {order.status === 'preparing' && order.estimatedReadyAt && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" /> Customer was told: ready by {clockTime(order.estimatedReadyAt)}
            </p>
          )}
        </div>

        <div className="space-y-2 p-4 pt-3">
          {order.status === 'placed' && (
            <>
              <Button className="w-full" loading={busy === 'preparing'} onClick={() => onAction(order, 'preparing')}>
                <ChefHat className="h-4 w-4" /> Accept & start cooking
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" loading={busy === 'ready'} onClick={() => onAction(order, 'ready')}>
                  Ready now
                </Button>
                <Button variant="danger" size="sm" onClick={() => onAction(order, 'reject')}>
                  Reject
                </Button>
              </div>
            </>
          )}
          {order.status === 'preparing' && (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button variant="success" loading={busy === 'ready'} onClick={() => onAction(order, 'ready')}>
                <CheckCircle2 className="h-4 w-4" /> Food is ready
              </Button>
              <Button variant="danger" onClick={() => onAction(order, 'reject')} aria-label="Reject order">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          {order.status === 'ready' && (
            <Button variant="dark" className="w-full" loading={busy === 'completed'} onClick={() => onAction(order, 'completed')}>
              {cashDue
                ? `Collect ${rupees(order.total)} & ${atTable ? 'mark served' : 'hand over'}`
                : atTable
                  ? `Served at ${order.table.name}`
                  : 'Handed over to customer'}
            </Button>
          )}
          {cashDue && order.status !== 'ready' && (
            <button
              onClick={() => onAction(order, 'mark-paid')}
              className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-800"
              disabled={busy === 'mark-paid'}
            >
              {busy === 'mark-paid' ? 'Saving…' : `Got ${rupees(order.total)} in cash already? Mark as paid`}
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
});

function RejectModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    await onConfirm(reason);
    setSaving(false);
    setReason('');
  };

  const refundNote =
    order?.paymentStatus === 'paid' && order.paymentMethod === 'online'
      ? `The customer paid online. ${rupees(order.total)} will be refunded automatically.`
      : null;

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={`Reject order #${order?.token}?`}
      size="sm"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            Keep order
          </Button>
          <Button variant="destructive" loading={saving} onClick={confirm}>
            Reject
          </Button>
        </div>
      }
    >
      <p className="text-sm text-gray-600">The customer will see this reason on their phone.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {REJECT_REASONS.map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={cx(
              'rounded-full border px-3 py-1.5 text-sm transition active:scale-95',
              reason === r ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-gray-300 text-gray-700'
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <Textarea className="mt-3" rows={2} placeholder="Or type a reason…" value={reason} onChange={(e) => setReason(e.target.value)} />
      {refundNote && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900">{refundNote}</p>}
    </Modal>
  );
}

function LiveOrders() {
  const { activeOrders, ordersLoaded, applyOrder } = useDashboard();
  const { vendor } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState({}); // { [orderId]: action }
  const [rejecting, setRejecting] = useState(null);

  const run = async (order, action, reason) => {
    setBusy((b) => ({ ...b, [order.id]: action }));
    try {
      const data =
        action === 'mark-paid'
          ? await api.post(`/vendor/orders/${order.id}/mark-paid`)
          : await api.patch(`/vendor/orders/${order.id}/status`, { status: action, reason });
      applyOrder(data.order);
      if (action === 'completed') toast.success(`Order #${order.token} completed 🎉`);
    } catch (err) {
      toast.error(err.message);
    }
    setBusy((b) => ({ ...b, [order.id]: null }));
  };

  const onAction = (order, action) => (action === 'reject' ? setRejecting(order) : run(order, action));

  if (!ordersLoaded) return <PageLoader />;

  if (!activeOrders.length) {
    return (
      <EmptyState
        emoji={vendor.isOpen ? '🍳' : '😴'}
        title={vendor.isOpen ? 'Waiting for orders…' : 'Your shop is closed'}
        text={
          vendor.isOpen
            ? 'Keep this page open. New orders pop up here with a sound.'
            : 'Tap "Closed" at the top to open your shop and start taking orders.'
        }
      />
    );
  }

  return (
    <>
      <LayoutGroup>
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-4">
          {COLUMNS.map((col) => {
            const orders = activeOrders.filter((o) => o.status === col.status);
            return (
              <section key={col.status} className="rounded-3xl bg-gray-100/70 p-3">
                <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-bold text-gray-700">
                  <span className="text-lg">{col.emoji}</span>
                  {col.title}
                  <span className={cx('ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold', col.tint)}>{orders.length}</span>
                </h2>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} busy={busy[order.id]} onAction={onAction} />
                    ))}
                  </AnimatePresence>
                  {!orders.length && (
                    <p className="rounded-2xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">{col.empty}</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </LayoutGroup>
      <RejectModal
        order={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={async (reason) => {
          await run(rejecting, 'rejected', reason);
          setRejecting(null);
        }}
      />
    </>
  );
}

function OrderHistory() {
  const { version } = useDashboard();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.get('/vendor/orders?scope=history');
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!orders) return <PageLoader />;
  if (!orders.length) return <EmptyState emoji="🧾" title="No past orders yet" text="Completed orders will show up here." />;

  return (
    <Card className="divide-y divide-gray-100 overflow-hidden">
      {orders.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.4) }}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 transition hover:bg-gray-50"
        >
          <span className="w-12 font-display text-xl font-bold text-gray-900">#{order.token}</span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate font-semibold text-gray-900">
              {order.customerName} <WhereBadge order={order} />
            </p>
            <p className="truncate text-sm text-gray-500">{order.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}</p>
            {order.cancelReason && order.status !== 'completed' && <p className="text-xs text-red-600">{order.cancelReason}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-semibold text-gray-900">{rupees(order.total)}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="w-full text-xs text-gray-500 sm:w-auto sm:text-right">
            <p>{dateTime(order.createdAt)}</p>
            <p>
              {paymentLabel(order)} · {itemCount(order.items)} items
            </p>
          </div>
        </motion.div>
      ))}
    </Card>
  );
}

export default function Orders() {
  const [tab, setTab] = useState('live');
  const { activeOrders, ordersLoaded } = useDashboard();

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span className="relative h-2 w-2 rounded-full bg-green-500">
              <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-60" />
            </span>
            Live: new orders appear automatically
          </span>
        }
        action={
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-soft ring-1 ring-gray-100">
            {[
              ['live', `Live${ordersLoaded ? ` (${activeOrders.length})` : ''}`],
              ['history', 'History'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cx('relative rounded-xl px-4 py-1.5 text-sm font-semibold transition', tab === key ? 'text-white' : 'text-gray-600')}
              >
                {tab === key && (
                  <motion.span layoutId="orders-tab" className="absolute inset-0 rounded-xl bg-gray-900" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        }
      />
      {tab === 'live' ? <LiveOrders /> : <OrderHistory />}
    </div>
  );
}
