import { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Banknote, Clock, MapPin, Phone, ScanLine, Smartphone, Star, UtensilsCrossed, Wallet } from 'lucide-react';
import { APP_NAME } from '../lib/format';
import { ShopCover, ShopLogo } from './shop';
import { cx } from './ui';

// Shown in the middle of the QR code when the shop has no logo (orange bag icon)
const APP_ICON =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#ea580c"/><path d="M9 13h14l-1.5 10a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7L9 13Z" fill="#fff"/><path d="M12 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
  );

/**
 * Loads an image URL as a data: URL. The logo inside the QR must be inline data, otherwise
 * it goes missing when the poster is saved as a PNG.
 */
function useInlineImage(src) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    setDataUrl(null);
    if (!src) return undefined;
    let cancelled = false;
    fetch(src)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      )
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);
  return dataUrl;
}

export function menuLink(shop, table) {
  const url = `${window.location.origin}/s/${shop.slug}`;
  return table ? `${url}?table=${table.code}` : url;
}

const STEPS = [
  { icon: ScanLine, label: 'Scan' },
  { icon: UtensilsCrossed, label: 'Pick food' },
  { icon: Wallet, label: 'Pay & enjoy' },
];

/**
 * Printable poster for the stall (or one table). `compact` is a smaller version used when
 * printing many table QRs on one page.
 */
export const QrPoster = forwardRef(function QrPoster({ shop, table, compact = false, className }, ref) {
  const qrSize = compact ? 150 : 184;
  const inlineLogo = useInlineImage(shop.logoUrl);
  const logoInQr = inlineLogo || APP_ICON;

  return (
    <div
      ref={ref}
      className={cx(
        'overflow-hidden rounded-[28px] bg-white text-gray-900 shadow-lift ring-1 ring-black/5',
        compact ? 'w-[320px]' : 'w-[360px]',
        className
      )}
    >
      <ShopCover src={shop.coverUrl} className={compact ? 'h-24' : 'h-40'}>
        <div className="flex items-start justify-between p-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 shadow-sm">
            📱 Order from your phone
          </span>
          {shop.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-gray-900 shadow-sm">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {shop.rating?.toFixed(1)}
            </span>
          )}
        </div>
      </ShopCover>

      <div className={cx('relative flex flex-col items-center px-6 text-center', compact ? '-mt-8 pb-4' : '-mt-11 pb-5')}>
        <ShopLogo src={shop.logoUrl} name={shop.shopName} className={compact ? 'h-16 w-16 text-lg' : 'h-20 w-20 text-2xl'} />
        <h2 className={cx('mt-2 font-display font-extrabold leading-[1.05]', compact ? 'text-2xl' : 'text-[30px]')}>{shop.shopName}</h2>
        {!compact && shop.description && <p className="mt-1 line-clamp-2 text-[13px] text-gray-500">{shop.description}</p>}
        {shop.openingHours && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
            <Clock className="h-3 w-3" /> Open {shop.openingHours}
          </p>
        )}

        {table && (
          <div className="mt-3 rounded-2xl bg-gray-900 px-6 py-1.5 text-white shadow-lift">
            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-brand-300">Table</p>
            <p className="font-display text-3xl font-extrabold leading-tight">{table.name.replace(/^table\s*/i, '') || table.name}</p>
          </div>
        )}

        {/* QR with a gradient frame */}
        <div className={cx('relative rounded-[26px] bg-gradient-to-br from-brand-500 via-rose-500 to-amber-400 p-[3px]', table ? 'mt-5' : 'mt-6')}>
          <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
            Scan to order
          </span>
          <div className="rounded-[23px] bg-white p-3.5">
            <QRCodeSVG
              value={menuLink(shop, table)}
              size={qrSize}
              level="H"
              fgColor="#1c1917"
              imageSettings={{ src: logoInQr, height: qrSize * 0.22, width: qrSize * 0.22, excavate: true }}
            />
          </div>
        </div>

        <div className={cx('grid w-full grid-cols-3', compact ? 'mt-3' : 'mt-5')}>
          {STEPS.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <span className="text-[11px] font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {!compact && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {shop.acceptOnline && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                <Smartphone className="h-3 w-3 text-brand-600" /> UPI · Cards
              </span>
            )}
            {shop.acceptCounter && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                <Banknote className="h-3 w-3 text-green-600" /> Cash at counter
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 bg-gray-900 px-5 py-2.5 text-[11px] text-gray-300">
        <span className="flex min-w-0 items-center gap-1">
          {shop.address ? (
            <>
              <MapPin className="h-3 w-3 shrink-0 text-brand-400" />
              <span className="truncate">{shop.address}</span>
            </>
          ) : (
            <span>Powered by {APP_NAME}</span>
          )}
        </span>
        {shop.phone && (
          <span className="flex shrink-0 items-center gap-1">
            <Phone className="h-3 w-3 text-brand-400" /> {shop.phone}
          </span>
        )}
      </div>
    </div>
  );
});

/** Saves a poster as a high-resolution PNG (good enough for a print shop). */
export async function downloadAsPng(node, filename) {
  const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: false });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * print(<Posters/>) renders the posters into a hidden print-only area, waits for their images,
 * and opens the browser's print dialog. Render {portal} somewhere in the page.
 */
export function usePrint() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (!content) return undefined;
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => requestAnimationFrame(r));
      const images = [...document.querySelectorAll('.print-only img, .print-only image')];
      await Promise.all(images.map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
      await document.fonts?.ready;
      if (cancelled) return;
      window.print();
      setContent(null);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [content]);

  const portal = content ? createPortal(<div className="print-only">{content}</div>, document.body) : null;
  return { print: setContent, portal };
}
