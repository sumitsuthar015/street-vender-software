import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import ImagePicker from '../../components/ImagePicker';
import { FoodImage, RatingPill, VegMark } from '../../components/food';
import { fadeUpItem, staggerParent } from '../../components/motion';
import { useToast } from '../../components/Toast';
import { Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, PageLoader, Textarea, Toggle, cx, inputClass } from '../../components/ui';
import { api } from '../../lib/api';
import { foodEmoji } from '../../lib/emoji';
import { rupees } from '../../lib/format';

const EMPTY_ITEM = {
  name: '',
  price: '',
  category: '',
  description: '',
  isVeg: true,
  prepTime: 10,
  isAvailable: true,
};

function ItemForm({ item, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() =>
    item ? { ...EMPTY_ITEM, ...item, price: String(item.price), category: item.category } : EMPTY_ITEM
  );
  // undefined = unchanged, null = removed, string = new photo
  const [image, setImage] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const preview = image === undefined ? item?.imageUrl : image;

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price < 0) {
      setError('Please enter a valid price');
      return;
    }
    const body = {
      name: form.name,
      price,
      category: form.category.trim(),
      description: form.description,
      isVeg: form.isVeg,
      prepTime: Number(form.prepTime) || 10,
      isAvailable: form.isAvailable,
    };
    if (image !== undefined) body.image = image;

    setSaving(true);
    try {
      const data = item ? await api.patch(`/vendor/menu/${item.id}`, body) : await api.post('/vendor/menu', body);
      toast.success(item ? 'Dish updated' : `${data.item.name} added to your menu`);
      onSaved(data.item);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'Edit dish' : 'Add a dish'}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="item-form" className="flex-1" loading={saving}>
            {item ? 'Save changes' : 'Add to menu'}
          </Button>
        </div>
      }
    >
      <form id="item-form" onSubmit={save} className="space-y-4">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <ImagePicker value={preview} onChange={setImage} className="h-24 w-24 shrink-0" label="Add photo" />
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Dish photo (optional)</p>
            <p className="text-gray-500">Good photos get more orders 📸</p>
            {!preview && (
              <p className="mt-1 text-xs text-gray-400">
                Without a photo, customers see {foodEmoji(form.name, form.category)} for this dish.
              </p>
            )}
          </div>
        </div>

        <Input label="Dish name" placeholder="e.g. Paneer Kathi Roll" required value={form.name} onChange={set('name')} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₹)">
            {(id) => (
              <input
                id={id}
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="60"
                required
                value={form.price}
                onChange={set('price')}
              />
            )}
          </Field>
          <Field label="Ready in (minutes)">
            {(id) => (
              <input
                id={id}
                className={inputClass}
                type="number"
                inputMode="numeric"
                min="1"
                max="180"
                value={form.prepTime}
                onChange={set('prepTime')}
              />
            )}
          </Field>
        </div>

        <Field label="Category" hint="Dishes are grouped by category on your menu">
          {(id) => (
            <>
              <input
                id={id}
                className={inputClass}
                list="menu-categories"
                placeholder="e.g. Chaat, Rolls, Drinks"
                value={form.category}
                onChange={set('category')}
              />
              <datalist id="menu-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </Field>

        <Field label="Type">
          {() => (
            <div className="grid grid-cols-2 gap-2">
              {[
                [true, 'Veg'],
                [false, 'Non-veg'],
              ].map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm({ ...form, isVeg: value })}
                  className={cx(
                    'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium',
                    form.isVeg === value ? 'border-brand-600 bg-brand-50 text-gray-900' : 'border-gray-300 text-gray-600'
                  )}
                >
                  <VegMark isVeg={value} /> {label}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Textarea
          label="Description (optional)"
          rows={2}
          placeholder="What's in it? Spicy? Serves how many?"
          value={form.description}
          onChange={set('description')}
          maxLength={300}
        />

        <Toggle
          label="Available today"
          description="Turn off when it's sold out; customers will see “Sold out”"
          checked={form.isAvailable}
          onChange={(v) => setForm({ ...form, isAvailable: v })}
        />

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}

function MenuRow({ item, onEdit, onDelete, onToggle }) {
  return (
    <motion.div layout variants={fadeUpItem} className={cx('flex gap-3 p-3 transition-colors sm:p-4', !item.isAvailable && 'bg-gray-50')}>
      <FoodImage
        src={item.imageUrl}
        alt={item.name}
        name={item.name}
        category={item.category}
        className={cx('h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20', !item.isAvailable && 'opacity-50 grayscale')}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <VegMark isVeg={item.isVeg} className="mt-0.5" />
          <p className="font-semibold leading-tight text-gray-900">{item.name}</p>
        </div>
        <p className="mt-1 font-semibold text-gray-900">{rupees(item.price)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {item.prepTime} min
          </span>
          {item.orderCount > 0 && <span>{item.orderCount} sold</span>}
          <RatingPill rating={item.rating} count={item.ratingCount} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cx('text-xs font-medium', item.isAvailable ? 'text-green-700' : 'text-gray-500')}>
            {item.isAvailable ? 'In stock' : 'Sold out'}
          </span>
          <Toggle checked={item.isAvailable} onChange={() => onToggle(item)} ariaLabel={`${item.name} in stock`} />
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(item)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label={`Edit ${item.name}`}>
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(item)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${item.name}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Menu() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, item = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.get('/vendor/menu');
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => [...new Set((items || []).map((i) => i.category))], [items]);
  const grouped = useMemo(
    () => categories.map((c) => ({ category: c, items: items.filter((i) => i.category === c) })),
    [categories, items]
  );

  const upsert = (item) => {
    setItems((list) => {
      const exists = list.some((i) => i.id === item.id);
      return exists ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item];
    });
  };

  const toggleAvailable = async (item) => {
    upsert({ ...item, isAvailable: !item.isAvailable }); // instant feedback
    try {
      const data = await api.patch(`/vendor/menu/${item.id}`, { isAvailable: !item.isAvailable });
      upsert(data.item);
    } catch (err) {
      upsert(item);
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/vendor/menu/${deleting.id}`);
      setItems((list) => list.filter((i) => i.id !== deleting.id));
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteBusy(false);
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Menu"
        subtitle={`${items.length} dishes · ${items.filter((i) => !i.isAvailable).length} sold out`}
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Add dish
          </Button>
        }
      />

      {!items.length ? (
        <EmptyState
          emoji="🍽️"
          title="Your menu is empty"
          text="Add the dishes you sell with their prices. Customers will see them when they scan your QR code."
          action={
            <Button onClick={() => setEditing({})}>
              <Plus className="h-4 w-4" /> Add your first dish
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="mb-2 flex items-center gap-2 px-1 font-display text-lg font-bold text-gray-800">
                <span>{foodEmoji('', group.category)}</span>
                {group.category}
                <span className="text-sm font-medium text-gray-400">({group.items.length})</span>
              </h2>
              <Card className="overflow-hidden">
                <motion.div variants={staggerParent} initial="hidden" animate="show" className="divide-y divide-gray-100">
                  {group.items.map((item) => (
                    <MenuRow key={item.id} item={item} onEdit={setEditing} onDelete={setDeleting} onToggle={toggleAvailable} />
                  ))}
                </motion.div>
              </Card>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <ItemForm
          item={editing.id ? editing : null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(item) => {
            upsert(item);
            setEditing(null);
          }}
        />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this dish?"
        size="sm"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={deleteBusy} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          <strong>{deleting?.name}</strong> will be removed from your menu. Old orders keep their details. Just want to
          hide it for today? Switch it to “Sold out” instead.
        </p>
      </Modal>
    </div>
  );
}
