import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FoodImage, Stars } from '../../components/food';
import { Card, EmptyState, ErrorState, PageHeader, PageLoader, cx } from '../../components/ui';
import { api } from '../../lib/api';
import { timeAgo } from '../../lib/format';

export default function Reviews() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(0); // 0 = all, 1-5 = only that many stars

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await api.get('/vendor/reviews'));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data?.reviews.forEach((r) => (c[r.rating] += 1));
    return c;
  }, [data]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <PageLoader />;

  const { reviews, rating, ratingCount } = data;
  const shown = filter ? reviews.filter((r) => r.rating === filter) : reviews;
  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <div>
      <PageHeader title="Reviews" subtitle="What customers say about your food" />

      {!ratingCount ? (
        <EmptyState
          emoji="⭐"
          title="No reviews yet"
          text="After an order is completed, customers can rate each dish from their phone. Ratings show on your menu to help new customers choose."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit overflow-hidden p-5">
            <div className="-mx-5 -mt-5 mb-4 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 px-5 py-5 text-white">
              <p className="text-sm font-semibold text-white/90">Overall rating</p>
              <p className="font-display text-6xl font-extrabold leading-none">{rating.toFixed(1)}</p>
            </div>
            <div className="mt-1">
              <Stars value={rating} />
            </div>
            <p className="mt-1 text-sm text-gray-500">{ratingCount} ratings</p>

            <div className="mt-5 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setFilter(filter === stars ? 0 : stars)}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-sm',
                    filter === stars ? 'bg-brand-50' : 'hover:bg-gray-50'
                  )}
                  aria-pressed={filter === stars}
                >
                  <span className="w-6 text-gray-600">{stars}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <motion.span
                      className="block h-full rounded-full bg-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${(counts[stars] / maxCount) * 100}%` }}
                      transition={{ duration: 0.7, delay: (5 - stars) * 0.08 }}
                    />
                  </span>
                  <span className="w-8 text-right tabular-nums text-gray-500">{counts[stars]}</span>
                </button>
              ))}
            </div>
            {filter > 0 && (
              <button onClick={() => setFilter(0)} className="mt-3 text-sm font-semibold text-brand-700">
                Show all reviews
              </button>
            )}
          </Card>

          <Card className="divide-y divide-gray-100">
            {shown.length === 0 && <p className="p-5 text-sm text-gray-500">No {filter}-star reviews.</p>}
            {shown.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 font-semibold text-gray-900">
                    <FoodImage name={review.itemName} className="h-9 w-9 rounded-xl" emojiClass="text-lg" />
                    {review.itemName}
                  </div>
                  <Stars value={review.rating} />
                </div>
                {review.comment && <p className="mt-1.5 text-gray-700">“{review.comment}”</p>}
                <p className="mt-1.5 text-xs text-gray-500">
                  {review.customerName} · {timeAgo(review.createdAt)}
                </p>
              </motion.div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
