import { Star } from 'lucide-react';
import { foodEmoji, tileGradient } from '../lib/emoji';
import { ORDER_STATUS } from '../lib/format';
import { Badge, cx } from './ui';

/** The standard Indian veg (green) / non-veg (red) square symbol. */
export function VegMark({ isVeg, className }) {
  return (
    <span
      title={isVeg ? 'Veg' : 'Non-veg'}
      aria-label={isVeg ? 'Veg' : 'Non-veg'}
      className={cx(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white',
        isVeg ? 'border-green-600' : 'border-red-600',
        className
      )}
    >
      <span className={cx('h-2 w-2 rounded-full', isVeg ? 'bg-green-600' : 'bg-red-600')} />
    </span>
  );
}

/** Small "4.5 ★ (23)" rating pill. */
export function RatingPill({ rating, count, className }) {
  if (!count) return null;
  const color = rating >= 4 ? 'from-emerald-500 to-green-600' : rating >= 3 ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500';
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs font-medium text-gray-600', className)}>
      <span className={cx('inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r px-1.5 py-0.5 font-bold text-white', color)}>
        {rating.toFixed(1)}
        <Star className="h-3 w-3 fill-current" />
      </span>
      ({count})
    </span>
  );
}

/** Read-only stars, e.g. ★★★★☆ */
export function Stars({ value, size = 'h-4 w-4' }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cx(size, n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200')}
        />
      ))}
    </span>
  );
}

/** Tappable stars for giving a rating. */
export function StarInput({ value, onChange }) {
  const labels = ['', 'Bad 😞', 'Okay 😐', 'Good 🙂', 'Very good 😋', 'Loved it! 🤩'];
  return (
    <div className="flex items-center gap-3">
      <div className="flex" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            className="p-1"
          >
            <Star
              className={cx(
                'h-8 w-8 transition-all duration-200 hover:scale-110 active:scale-90',
                n <= value ? 'scale-105 fill-amber-400 text-amber-400 drop-shadow' : 'fill-gray-100 text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-sm font-semibold text-gray-700">{labels[value]}</span>}
    </div>
  );
}

/** Dish photo, or a colourful tile with a matching food emoji when there's no photo. */
export function FoodImage({ src, alt, name = '', category = '', className, emojiClass = 'text-4xl' }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={cx('object-cover', className)} />;
  return (
    <div className={cx('flex items-center justify-center bg-gradient-to-br', tileGradient(name), className)} aria-hidden>
      <span className={cx('drop-shadow-sm', emojiClass)}>{foodEmoji(name, category)}</span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const meta = ORDER_STATUS[status] || { label: status, badge: 'bg-gray-100 text-gray-700' };
  return <Badge className={meta.badge}>{meta.label}</Badge>;
}
