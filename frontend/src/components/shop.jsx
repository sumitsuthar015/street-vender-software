import { cx } from './ui';

const PATTERN_EMOJIS = ['🥟', '🌶️', '☕', '🍛', '🌯', '🥤', '🍢', '🧅', '🍋', '🫓', '🍜', '🍗'];

/**
 * The stall's banner: its uploaded photo, or a warm gradient with a food-emoji pattern.
 * `children` are drawn on top (e.g. the shop name).
 */
export function ShopCover({ src, className, children, overlay = true }) {
  return (
    <div className={cx('relative overflow-hidden', className)}>
      {src ? (
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-rose-500 to-amber-400">
          <div className="absolute inset-0 grid grid-cols-6 place-items-center gap-2 p-2 text-2xl opacity-25" aria-hidden>
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} style={{ transform: `rotate(${(i % 5) * 18 - 36}deg)` }}>
                {PATTERN_EMOJIS[i % PATTERN_EMOJIS.length]}
              </span>
            ))}
          </div>
        </div>
      )}
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />}
      {children && <div className="relative h-full">{children}</div>}
    </div>
  );
}

/** Round shop logo, or the shop's first letter on a gradient. */
export function ShopLogo({ src, name = '', className }) {
  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-brand-500 to-rose-500 shadow-lift',
        className
      )}
    >
      {src ? (
        <img src={src} alt={`${name} logo`} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display text-[1.6em] font-extrabold leading-none text-white">{name.trim()[0]?.toUpperCase() || '🍽️'}</span>
      )}
    </div>
  );
}
