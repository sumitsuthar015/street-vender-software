import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Armchair,
  Banknote,
  ChevronRight,
  Clock,
  CreditCard,
  Flame,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { FoodImage, RatingPill, Stars, VegMark } from '../../components/food';
import { ShopCover, ShopLogo } from '../../components/shop';
import { useToast } from '../../components/Toast';
import { Badge, Button, ErrorState, Input, Modal, Spinner, Textarea, cx } from '../../components/ui';
import { api } from '../../lib/api';
import { customerDetails, myOrders, useCart } from '../../lib/customer';
import { foodEmoji } from '../../lib/emoji';
import { APP_NAME, rupees, timeAgo } from '../../lib/format';

const isTopRated = (item) => item.ratingCount >= 3 && item.rating >= 4.5;
const sectionId = (category) => `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

function QtyStepper({ qty, onChange, disabled, size = 'md' }) {
  const h = size === 'sm' ? 'h-8' : 'h-9';
  if (!qty) {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={() => onChange(1)}
        className={cx(
          h,
          'inline-flex w-24 items-center justify-center gap-1 rounded-xl border border-green-200 bg-white text-sm font-extrabold text-green-700 shadow-lift',
          'transition hover:bg-green-50 disabled:border-gray-200 disabled:text-gray-400 disabled:shadow-none'
        )}
      >
        {disabled ? 'SOLD OUT' : (
          <>
            ADD <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </>
        )}
      </motion.button>
    );
  }
  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={cx(h, 'flex w-24 items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lift')}
    >
      <button className="flex h-full w-8 items-center justify-center active:scale-75" onClick={() => onChange(qty - 1)} aria-label="Remove one">
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={qty}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          className="text-sm font-extrabold"
        >
          {qty}
        </motion.span>
      </AnimatePresence>
      <button className="flex h-full w-8 items-center justify-center active:scale-75" onClick={() => onChange(qty + 1)} aria-label="Add one">
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </motion.div>
  );
}

function MenuItemCard({ item, qty, setQty, canOrder, bestseller, onShowReviews }) {
  const soldOut = !item.isAvailable;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cx('flex gap-4 py-6', soldOut && 'opacity-60')}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <VegMark isVeg={item.isVeg} />
          {bestseller && (
            <Badge className="bg-gradient-to-r from-brand-500 to-rose-500 text-white">
              <Flame className="h-3 w-3" /> Bestseller
            </Badge>
          )}
          {isTopRated(item) && (
            <Badge className="bg-amber-100 text-amber-800">
              <Star className="h-3 w-3 fill-current" /> Top rated
            </Badge>
          )}
        </div>
        <h3 className="mt-1.5 text-[17px] font-bold leading-snug text-gray-900">{item.name}</h3>
        <p className="mt-0.5 font-semibold text-gray-900">{rupees(item.price)}</p>
        {item.ratingCount > 0 && (
          <button onClick={() => onShowReviews(item)} className="mt-1.5 flex items-center gap-1 text-left transition hover:opacity-80">
            <RatingPill rating={item.rating} count={item.ratingCount} />
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
        {item.description && <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{item.description}</p>}
        <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" /> ~{item.prepTime} min
        </p>
      </div>
      <div className="relative w-32 shrink-0 sm:w-36">
        <FoodImage
          src={item.imageUrl}
          alt={item.name}
          name={item.name}
          category={item.category}
          emojiClass="text-5xl"
          className={cx('aspect-square w-full rounded-3xl shadow-soft', soldOut && 'grayscale')}
        />
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <QtyStepper qty={qty} onChange={(q) => setQty(item.id, q)} disabled={soldOut || !canOrder} />
        </div>
      </div>
    </motion.div>
  );
}

function ReviewsSheet({ slug, item, onClose }) {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    if (!item) return;
    setReviews(null);
    api
      .get(`/shops/${slug}/items/${item.id}/reviews`)
      .then((d) => setReviews(d.reviews))
      .catch(() => setReviews([]));
  }, [slug, item]);

  return (
    <Modal open={Boolean(item)} onClose={onClose} title={item?.name || ''}>
      {item && (
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <FoodImage src={item.imageUrl} name={item.name} category={item.category} className="h-16 w-16 rounded-2xl" emojiClass="text-3xl" />
          <div>
            <p className="font-display text-4xl font-extrabold leading-none text-gray-900">{item.rating?.toFixed(1)}</p>
            <Stars value={item.rating || 0} />
            <p className="text-xs text-gray-500">{item.ratingCount} ratings from people who ordered it</p>
          </div>
        </div>
      )}
      {!reviews ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {reviews.map((r, i) => (
            <motion.li key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="py-3">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} size="h-3.5 w-3.5" />
                <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
              </div>
              {r.comment && <p className="mt-1 text-gray-800">“{r.comment}”</p>}
              <p className="mt-0.5 text-xs font-medium text-gray-500">{r.customerName}</p>
            </motion.li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function CheckoutSheet({ open, onClose, shop, table, lines, total, onPlaced, onMenuChanged }) {
  const toast = useToast();
  const saved = customerDetails.get();
  const [name, setName] = useState(saved.name);
  const [phone, setPhone] = useState(saved.phone);
  const [note, setNote] = useState('');
  const [method, setMethod] = useState(shop.payments.online ? 'online' : 'counter');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const place = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const data = await api.post(`/shops/${shop.slug}/orders`, {
        customerName: name,
        customerPhone: phone,
        note,
        paymentMethod: method,
        tableCode: table?.code || '',
        items: lines.map((l) => ({ itemId: l.item.id, qty: l.qty })),
      });
      customerDetails.save({ name, phone });
      onPlaced(data.code, method);
    } catch (err) {
      setError(err.message);
      // Something changed (dish sold out, shop closed): show the latest menu
      if (err.status === 409) {
        toast.error(err.message);
        onMenuChanged();
      }
      setPlacing(false);
    }
  };

  const options = [
    shop.payments.online && { value: 'online', icon: CreditCard, title: 'Pay online now', text: 'UPI, cards, wallets' },
    shop.payments.counter && {
      value: 'counter',
      icon: Banknote,
      title: table ? 'Pay after eating' : 'Pay at counter',
      text: table ? 'Cash or UPI at the counter' : 'Cash or UPI when you collect',
    },
  ].filter(Boolean);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your order"
      footer={
        <Button type="submit" form="checkout-form" size="lg" className="w-full" loading={placing} disabled={!lines.length}>
          {method === 'online' ? `Pay ${rupees(total)}` : `Place order · ${rupees(total)}`}
        </Button>
      }
    >
      <form id="checkout-form" onSubmit={place} className="space-y-5">
        <div
          className={cx(
            'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold',
            table ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'bg-gray-100 text-gray-700'
          )}
        >
          {table ? <Armchair className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
          {table ? `Dine-in · served at ${table.name}` : 'Pickup at the counter'}
        </div>

        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
          <AnimatePresence initial={false}>
            {lines.map(({ item, qty, setQty }) => (
              <motion.li
                key={item.id}
                layout
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 bg-white px-3 py-3"
              >
                <FoodImage src={item.imageUrl} name={item.name} category={item.category} className="h-11 w-11 rounded-xl" emojiClass="text-xl" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-900">
                    <VegMark isVeg={item.isVeg} className="h-3.5 w-3.5" /> {item.name}
                  </p>
                  <p className="text-sm text-gray-500">{rupees(item.price * qty)}</p>
                </div>
                <QtyStepper qty={qty} onChange={setQty} size="sm" />
              </motion.li>
            ))}
          </AnimatePresence>
          <li className="flex items-center justify-between bg-gray-50 px-3 py-3 font-bold text-gray-900">
            <span>Total</span>
            <span className="text-lg">{rupees(total)}</span>
          </li>
        </ul>

        <div className="space-y-3">
          <Input label="Your name" placeholder="So the shop can call you" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Phone (optional)"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="In case the shop needs to reach you"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Textarea
            label="Note for the shop (optional)"
            rows={2}
            maxLength={200}
            placeholder="e.g. less spicy, no onion"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">How will you pay?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((o) => (
              <label
                key={o.value}
                className={cx(
                  'flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition',
                  method === o.value ? 'border-brand-500 bg-brand-50 shadow-glow' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  value={o.value}
                  checked={method === o.value}
                  onChange={() => setMethod(o.value)}
                  className="h-4 w-4 accent-brand-600"
                />
                <o.icon className="h-5 w-5 text-gray-600" />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{o.title}</span>
                  <span className="block text-xs text-gray-500">{o.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}

function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="skeleton h-60 rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-8 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 py-4">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/4" />
              <div className="skeleton h-4 w-full" />
            </div>
            <div className="skeleton h-32 w-32 rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

const SORTS = [
  ['recommended', 'Recommended'],
  ['rating', '⭐ Top rated'],
  ['price', '₹ Low to high'],
];

export default function ShopPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableCode = searchParams.get('table');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { cart, setQty, clear } = useCart(slug);
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [sort, setSort] = useState('recommended');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const chipsRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const d = await api.get(`/shops/${slug}${tableCode ? `?table=${encodeURIComponent(tableCode)}` : ''}`);
      setData(d);
      document.title = `${d.shop.shopName} - Menu`;
    } catch (err) {
      setError(err.message);
    }
  }, [slug, tableCode]);

  useEffect(() => {
    load();
  }, [load]);

  const items = data?.items || [];
  const shop = data?.shop;
  const table = data?.table || null;
  const badTable = Boolean(tableCode) && data && !table;
  const canOrder = Boolean(shop?.isOpen);

  // Top 3 most ordered dishes get a "Bestseller" badge
  const bestsellers = useMemo(
    () =>
      new Set(
        [...items]
          .filter((i) => i.orderCount >= 3)
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 3)
          .map((i) => i.id)
      ),
    [items]
  );

  const topRated = useMemo(
    () =>
      items
        .filter((i) => i.ratingCount > 0 && i.rating >= 4 && i.isAvailable)
        .sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount)
        .slice(0, 6),
    [items]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((i) => (!vegOnly || i.isVeg) && (!q || `${i.name} ${i.category} ${i.description}`.toLowerCase().includes(q)));
    if (sort === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.ratingCount - a.ratingCount);
    if (sort === 'price') list = [...list].sort((a, b) => a.price - b.price);
    // Sold out dishes go to the bottom
    return [...list].sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
  }, [items, search, vegOnly, sort]);

  const grouped = useMemo(() => {
    if (sort !== 'recommended' || search.trim()) return [{ category: null, items: visible }];
    const categories = [...new Set(visible.map((i) => i.category))];
    return categories.map((c) => ({ category: c, items: visible.filter((i) => i.category === c) }));
  }, [visible, sort, search]);
  const categories = grouped.filter((g) => g.category).map((g) => g.category);

  // Highlight the category chip of the section currently on screen
  useEffect(() => {
    if (!categories.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visibleEntry) setActiveCategory(visibleEntry.target.dataset.category);
      },
      { rootMargin: '-160px 0px -55% 0px' }
    );
    categories.forEach((c) => {
      const el = document.getElementById(sectionId(c));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join('|')]);

  // Keep the active chip scrolled into view
  useEffect(() => {
    const chip = chipsRef.current?.querySelector(`[data-chip="${activeCategory}"]`);
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeCategory]);

  // Cart lines for dishes that still exist and aren't sold out
  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: items.find((i) => i.id === id), qty }))
        .filter((l) => l.item && l.item.isAvailable)
        .map((l) => ({ ...l, setQty: (q) => setQty(l.item.id, q) })),
    [cart, items, setQty]
  );
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const recentOrders = myOrders.list().filter((o) => o.slug === slug && Date.now() - o.placedAt < 12 * 3600 * 1000);

  const onPlaced = (code, method) => {
    myOrders.add({ code, slug, shopName: shop.shopName, total, placedAt: Date.now() });
    clear();
    setCheckoutOpen(false);
    navigate(`/order/${code}`, { state: { startPayment: method === 'online' } });
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ShopSkeleton />;

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-32 shadow-soft">
      {/* Hero */}
      <ShopCover src={shop.coverUrl} className="h-60 sm:h-72">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex justify-end">
            <span
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-lg backdrop-blur',
                shop.isOpen ? 'bg-white/90 text-green-700' : 'bg-gray-900/80 text-white'
              )}
            >
              <span className={cx('relative h-2 w-2 rounded-full', shop.isOpen ? 'bg-green-500' : 'bg-gray-400')}>
                {shop.isOpen && <span className="absolute inset-0 animate-ping rounded-full bg-green-500" />}
              </span>
              {shop.isOpen ? 'Open now' : 'Closed'}
            </span>
          </div>
        </div>
      </ShopCover>

      <header className="relative -mt-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="rounded-3xl bg-white p-4 shadow-lift ring-1 ring-black/5"
        >
          <div className="flex items-start gap-3">
            <ShopLogo src={shop.logoUrl} name={shop.shopName} className="-mt-10 h-20 w-20 text-2xl" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[28px] font-extrabold leading-tight text-gray-900">{shop.shopName}</h1>
              {shop.description && <p className="text-sm text-gray-600">{shop.description}</p>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600">
            {shop.ratingCount > 0 && <RatingPill rating={shop.rating} count={shop.ratingCount} />}
            {shop.openingHours && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                <Clock className="h-3.5 w-3.5" /> {shop.openingHours}
              </span>
            )}
            {shop.address && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                <MapPin className="h-3.5 w-3.5" /> {shop.address}
              </span>
            )}
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
          </div>
        </motion.div>

        {table && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-white shadow-lg"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Armchair className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold">You're at {table.name}</p>
              <p className="text-xs text-white/85">Order here and we'll serve it at your table</p>
            </div>
            <Link to={`/s/${slug}`} className="text-xs font-semibold underline underline-offset-2">
              Takeaway?
            </Link>
          </motion.div>
        )}
        {badTable && (
          <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This table's QR code isn't active anymore. You can still order for pickup at the counter.
          </p>
        )}
        {!shop.isOpen && (
          <p className="mt-3 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-medium text-white">
            😴 This shop is closed right now. You can look at the menu, but ordering is paused.
          </p>
        )}
        {recentOrders.length > 0 && (
          <div className="mt-3 space-y-2">
            {recentOrders.slice(0, 2).map((o) => (
              <Link
                key={o.code}
                to={`/order/${o.code}`}
                className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm transition hover:bg-brand-100"
              >
                <span>
                  <span className="font-semibold text-gray-900">🧾 Your order</span>
                  <span className="text-gray-500">
                    {' '}
                    · {rupees(o.total)} · {timeAgo(o.placedAt)}
                  </span>
                </span>
                <span className="inline-flex items-center font-bold text-brand-700">
                  Track <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Search, filters & category tabs */}
      <div className="sticky top-0 z-20 mt-4 space-y-2 border-b border-gray-100 bg-white/90 px-4 pb-2 pt-3 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-base transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 sm:text-sm"
            placeholder="Search for dishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search dishes"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button
            onClick={() => setVegOnly((v) => !v)}
            className={cx(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition active:scale-95',
              vegOnly ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700'
            )}
            aria-pressed={vegOnly}
          >
            <VegMark isVeg /> Veg only
          </button>
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cx(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition active:scale-95',
                sort === key ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-700'
              )}
              aria-pressed={sort === key}
            >
              {label}
            </button>
          ))}
        </div>
        {categories.length > 1 && (
          <div ref={chipsRef} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4">
            {categories.map((c) => (
              <button
                key={c}
                data-chip={c}
                onClick={() => document.getElementById(sectionId(c))?.scrollIntoView({ behavior: 'smooth' })}
                className={cx('relative shrink-0 px-3 py-2 text-sm font-bold transition', activeCategory === c ? 'text-brand-700' : 'text-gray-500')}
              >
                {foodEmoji('', c)} {c}
                {activeCategory === c && (
                  <motion.span layoutId="cat-underline" className="absolute inset-x-2 -bottom-0.5 h-[3px] rounded-full bg-gradient-to-r from-brand-500 to-rose-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top rated strip */}
      {topRated.length > 0 && sort === 'recommended' && !search && (
        <section className="pt-6">
          <h2 className="flex items-center gap-2 px-4 font-display text-2xl font-extrabold text-gray-900">
            <span className="animate-wiggle">⭐</span> Customers love these
          </h2>
          <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {topRated.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onClick={() => setReviewItem(item)}
                className="w-40 shrink-0 snap-start overflow-hidden rounded-3xl bg-white text-left shadow-soft ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lift"
              >
                <FoodImage src={item.imageUrl} alt={item.name} name={item.name} category={item.category} className="aspect-[4/3] w-full" emojiClass="text-5xl" />
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-gray-900">{item.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <RatingPill rating={item.rating} count={item.ratingCount} />
                    <span className="text-sm font-bold text-gray-900">{rupees(item.price)}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Menu */}
      <main className="px-4">
        {!items.length && (
          <div className="py-16 text-center">
            <p className="animate-float text-5xl">👨‍🍳</p>
            <p className="mt-3 text-gray-500">This shop is still adding its menu. Check back soon!</p>
          </div>
        )}
        {items.length > 0 && !visible.length && (
          <div className="py-16 text-center">
            <p className="text-5xl">🔍</p>
            <p className="mt-3 text-gray-500">No dishes match your search.</p>
          </div>
        )}
        {grouped.map((group) => (
          <section
            key={group.category || 'all'}
            id={group.category ? sectionId(group.category) : undefined}
            data-category={group.category || undefined}
            className="scroll-mt-44 pt-5"
          >
            {group.category && (
              <h2 className="flex items-center gap-2 pt-2 font-display text-2xl font-extrabold text-gray-900">
                <span>{foodEmoji('', group.category)}</span>
                {group.category}
                <span className="text-base font-semibold text-gray-300">{group.items.length}</span>
              </h2>
            )}
            <div className="divide-y divide-dashed divide-gray-200">
              {group.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  qty={cart[item.id] || 0}
                  setQty={setQty}
                  canOrder={canOrder}
                  bestseller={bestsellers.has(item.id)}
                  onShowReviews={setReviewItem}
                />
              ))}
            </div>
          </section>
        ))}
        <p className="py-10 text-center text-xs text-gray-400">
          Menu powered by <span className="font-display font-bold text-brand-600">{APP_NAME}</span>
        </p>
      </main>

      {/* Cart bar */}
      <AnimatePresence>
        {count > 0 && canOrder && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setCheckoutOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 text-white shadow-[0_16px_40px_-12px_rgba(22,163,74,0.7)]"
            >
              <span className="text-left">
                <motion.span key={count} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="block text-xs font-bold uppercase opacity-90">
                  {count} item{count > 1 ? 's' : ''} added
                </motion.span>
                <span className="block text-xl font-extrabold">{rupees(total)}</span>
              </span>
              <span className="inline-flex items-center gap-2 font-bold">
                View cart <ShoppingBag className="h-5 w-5" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {checkoutOpen && (
        <CheckoutSheet
          open
          onClose={() => setCheckoutOpen(false)}
          shop={shop}
          table={table}
          lines={lines}
          total={total}
          onPlaced={onPlaced}
          onMenuChanged={load}
        />
      )}
      <ReviewsSheet slug={slug} item={reviewItem} onClose={() => setReviewItem(null)} />
    </div>
  );
}
