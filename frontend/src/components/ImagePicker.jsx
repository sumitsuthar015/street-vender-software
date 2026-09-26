import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { resizeImage } from '../lib/image';
import { useToast } from './Toast';
import { cx } from './ui';

/**
 * Tap to choose a photo; shows a preview. Calls onChange(dataUrl) with a resized JPEG,
 * or onChange(null) when removed.
 */
export default function ImagePicker({ value, onChange, shape = 'square', resize, label = 'Add photo', className }) {
  const input = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      onChange(await resizeImage(file, resize));
    } catch (err) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  return (
    <div className={cx('group relative', className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cx(
          'relative flex h-full w-full items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 transition',
          'hover:border-brand-400 hover:bg-brand-50',
          shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
        )}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="mr-1.5 h-4 w-4" /> Change
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1 px-2 text-center text-xs font-medium text-gray-500">
            {busy ? <Loader2 className="h-6 w-6 animate-spin text-brand-600" /> : <Camera className="h-6 w-6 text-brand-500" />}
            {label}
          </span>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 text-red-600 shadow-lift transition hover:scale-110"
          aria-label="Remove photo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
    </div>
  );
}
