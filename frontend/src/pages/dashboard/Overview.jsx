import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Banknote, CheckCircle2, Circle, ClipboardList, Flame, IndianRupee, Plus, QrCode, ShoppingBag, Star } from 'lucide-react';
import { FoodImage, RatingPill } from '../../components/food';
import { CountUp, fadeUpItem, staggerParent } from '../../components/motion';
import { ShopCover } from '../../components/shop';
import { Card, ErrorState, cx } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { compactRupees, rupees } from '../../lib/format';
import { greeting, useDashboard } from './DashboardLayout';

function StatTile({ label, value, format, sub, to, icon: Icon, tint }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', tint)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
        {typeof value === 'number' ? <CountUp value={value} format={format} /> : value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </>
  );
  const className = 'block h-full rounded-3xl border border-gray-100 bg-white p-4 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift';
  return (
    <motion.div variants={fadeUpItem}>
      {to ? (
        <Link to={to} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </motion.div>
  );
}

/** Rounds up to a "nice" axis maximum: 1, 2, 5 × 10^n */
function niceMax(value) {
  if (value <= 0) return 100;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => s * power >= value);
  return step * power;
}

const dayLabel = (key, opts) => new Date(`${key}T12:00:00`).toLocaleDateString('en-IN', opts);

/** Earnings per day for the last 7 days, as a simple column chart. */
function EarningsChart({ daily }) {
  const [active, setActive] = useState(null);
  const max = niceMax(Math.max(...daily.map((d) => d.revenue)));
  const hasSales = daily.some((d) => d.revenue > 0);
  const todayIndex = daily.length - 1;
  const HEIGHT = 170;

  return (
    <Card className="p-5">
      <h2 className="font-display text-xl font-bold text-gray-900">Earnings, last 7 days</h2>
      <p className="text-xs text-gray-500">Paid orders only · tap a day for details</p>

      <div className="mt-5 flex gap-2">
        {/* Y axis */}
        <div className="relative w-10 shrink-0 text-right text-[11px] tabular-nums text-gray-400" style={{ height: HEIGHT }}>
          {[1, 0.5, 0].map((f) => (
            <span key={f} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - f) * 100}%` }}>
              {compactRupees(max * f)}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* Gridlines */}
          {[1, 0.5].map((f) => (
            <div key={f} className="absolute inset-x-0 h-px bg-gray-100" style={{ top: `${(1 - f) * HEIGHT}px` }} />
          ))}
          {!hasSales && <p className="absolute inset-x-0 top-1/3 text-center text-sm text-gray-400">No paid orders yet this week</p>}

          <div className="relative flex" style={{ height: HEIGHT }}>
            {daily.map((d, i) => {
              const h = Math.max(Math.round((d.revenue / max) * HEIGHT), d.revenue > 0 ? 2 : 0);
              const isActive = active === i;
              return (
                <button
                  key={d.day}
                  type="button"
                  className="group relative flex flex-1 items-end justify-center focus:outline-none"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(isActive ? null : i)}
                  aria-label={`${dayLabel(d.day, { weekday: 'long' })}: ${rupees(d.revenue)} from ${d.orders} order${d.orders === 1 ? '' : 's'}`}
                >
                  {d.revenue > 0 && (
                    <motion.span
                      className={cx('w-full max-w-[24px] rounded-t-[4px] transition-opacity', active !== null && !isActive && 'opacity-60')}
                      style={{ backgroundColor: '#ea580c' }}
                      initial={{ height: 0 }}
                      animate={{ height: h }}
                      transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  {/* Direct label on today's column only */}
                  {i === todayIndex && d.revenue > 0 && !isActive && (
                    <span className="absolute text-[11px] font-semibold text-gray-700" style={{ bottom: h + 4 }}>
                      {compactRupees(d.revenue)}
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-xl bg-gray-900 px-2.5 py-1.5 text-left text-xs text-white shadow-lg"
                      style={{ bottom: Math.min(h + 8, HEIGHT - 20) }}
                    >
                      <span className="block text-sm font-bold">{rupees(d.revenue)}</span>
                      <span className="block text-gray-300">
                        {dayLabel(d.day, { weekday: 'short', day: 'numeric', month: 'short' })} · {d.orders} order{d.orders === 1 ? '' : 's'}
                      </span>
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="h-px bg-gray-300" />
          <div className="mt-1.5 flex">
            {daily.map((d, i) => (
              <span key={d.day} className={cx('flex-1 text-center text-[11px]', i === todayIndex ? 'font-semibold text-gray-900' : 'text-gray-500')}>
                {i === todayIndex ? 'Today' : dayLabel(d.day, { weekday: 'short' })}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ItemList({ title, icon: Icon, items, empty, render }) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-gray-900">
        <Icon className="h-5 w-5 text-brand-600" /> {title}
      </h2>
      {items.length ? (
        <ol className="mt-4 space-y-3">
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <span className={cx('w-5 text-center text-sm font-bold', i === 0 ? 'text-amber-500' : 'text-gray-300')}>{i === 0 ? '🥇' : i + 1}</span>
              <FoodImage src={item.imageUrl} name={item.name} category={item.category} className="h-11 w-11 rounded-xl" emojiClass="text-xl" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{item.name}</span>
              {render(item)}
            </motion.li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-gray-500">{empty}</p>
      )}
    </Card>
  );
}

function GettingStarted({ menuCount, hasPhoto, isOpen }) {
  const steps = [
    { done: menuCount > 0, title: 'Add dishes to your menu', to: '/dashboard/menu' },
    { done: hasPhoto, title: 'Add a photo of your stall & logo', to: '/dashboard/settings' },
    { done: false, title: 'Print your QR poster and stick it at your stall', to: '/dashboard/qr' },
    { done: isOpen, title: 'Keep your shop “Open” (switch at the top)', to: null },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-rose-50 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gray-900">🚀 Get your stall online</h2>
        <span className="text-sm font-semibold text-brand-700">
          {doneCount}/{steps.length}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-rose-500"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / steps.length) * 100}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {steps.map((s) => {
          const content = (
            <>
              {s.done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-gray-300" />}
              <span className={cx('flex-1 text-sm', s.done ? 'text-gray-500 line-through' : 'font-semibold text-gray-900')}>{s.title}</span>
              {s.to && !s.done && <ArrowRight className="h-4 w-4 text-brand-500" />}
            </>
          );
          return (
            <li key={s.title}>
              {s.to ? (
                <Link to={s.to} className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm transition hover:translate-x-1">
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HeroBanner({ vendor, activeOrders }) {
  return (
    <ShopCover src={vendor.coverUrl} className="rounded-[2rem] shadow-lift">
      <div className="flex min-h-[180px] flex-col justify-end gap-4 p-5 text-white sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-sm font-medium text-white/85">{greeting()} 👋</p>
          <h1 className="font-display text-3xl font-extrabold leading-tight drop-shadow sm:text-4xl">{vendor.shopName}</h1>
          <p className="mt-1 text-sm text-white/85">
            {activeOrders > 0 ? `${activeOrders} order${activeOrders > 1 ? 's' : ''} cooking right now 🔥` : "Here's how today is going."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-gray-900 shadow-lg transition hover:-translate-y-0.5">
            <ClipboardList className="h-4 w-4 text-brand-600" /> Orders
          </Link>
          <Link to="/dashboard/menu" className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-sm font-bold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/30">
            <Plus className="h-4 w-4" /> Add dish
          </Link>
          <Link to="/dashboard/qr" className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-sm font-bold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/30">
            <QrCode className="h-4 w-4" /> QR codes
          </Link>
        </div>
      </div>
    </ShopCover>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-48 rounded-[2rem]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-3xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-3xl" />
    </div>
  );
}

export default function Overview() {
  const { vendor } = useAuth();
  const { version } = useDashboard();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setStats(await api.get('/vendor/stats'));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Reload when orders change (debounced, several updates can arrive together)
  useEffect(() => {
    const timer = setTimeout(load, version ? 600 : 0);
    return () => clearTimeout(timer);
  }, [load, version]);

  if (error && !stats) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <OverviewSkeleton />;

  const { today } = stats;
  const isNew = stats.menuCount === 0 || stats.daily.every((d) => d.orders === 0);

  return (
    <div className="space-y-5">
      <HeroBanner vendor={vendor} activeOrders={today.activeOrders} />

      {isNew && <GettingStarted menuCount={stats.menuCount} hasPhoto={Boolean(vendor.coverUrl && vendor.logoUrl)} isOpen={vendor.isOpen} />}

      <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Orders today" value={today.orders} icon={ShoppingBag} tint="bg-sky-50 text-sky-600" to="/dashboard/orders" />
        <StatTile label="Earned today" value={today.revenue} format={rupees} icon={IndianRupee} tint="bg-emerald-50 text-emerald-600" sub="Paid orders" />
        <StatTile
          label="Cash to collect"
          value={today.cashToCollect}
          format={rupees}
          icon={Banknote}
          tint="bg-amber-50 text-amber-600"
          sub="From orders in progress"
          to="/dashboard/orders"
        />
        <StatTile
          label="Customer rating"
          value={stats.rating ? `${stats.rating.toFixed(1)} ★` : '–'}
          icon={Star}
          tint="bg-rose-50 text-rose-500"
          sub={stats.ratingCount ? `${stats.ratingCount} ratings` : 'No ratings yet'}
          to="/dashboard/reviews"
        />
      </motion.div>

      <EarningsChart daily={stats.daily} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ItemList
          title="Best sellers"
          icon={Flame}
          items={stats.bestSellers}
          empty="Your most ordered dishes will show here."
          render={(item) => <span className="text-sm font-medium text-gray-500">{item.orderCount} sold</span>}
        />
        <ItemList
          title="Top rated"
          icon={Star}
          items={stats.topRated}
          empty="Dishes rated by customers will show here."
          render={(item) => <RatingPill rating={item.rating} count={item.ratingCount} />}
        />
      </div>
    </div>
  );
}
