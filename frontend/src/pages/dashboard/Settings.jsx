import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, LogOut } from 'lucide-react';
import ImagePicker from '../../components/ImagePicker';
import { ShopCover, ShopLogo } from '../../components/shop';
import { useToast } from '../../components/Toast';
import { Button, Card, Input, PageHeader, Spinner, Textarea, Toggle } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function Section({ title, description, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function ShopDetails() {
  const { vendor, setVendor } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    shopName: vendor.shopName,
    name: vendor.name,
    phone: vendor.phone,
    address: vendor.address,
    openingHours: vendor.openingHours || '',
    description: vendor.description,
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.patch('/vendor/profile', form);
      setVendor(data.vendor);
      toast.success('Shop details saved');
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <Section title="Shop details" description="Customers see these at the top of your menu.">
      <form onSubmit={save} className="space-y-4">
        <Input label="Shop name" required value={form.shopName} onChange={set('shopName')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Owner name" required value={form.name} onChange={set('name')} />
          <Input label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Address / location" placeholder="e.g. Stall 12, near City Mall gate" value={form.address} onChange={set('address')} />
          <Input label="Opening hours" placeholder="e.g. 5 PM - 11 PM" maxLength={60} value={form.openingHours} onChange={set('openingHours')} />
        </div>
        <Textarea
          label="About your shop"
          rows={2}
          maxLength={300}
          placeholder="e.g. Famous for spicy pani puri since 2010"
          value={form.description}
          onChange={set('description')}
        />
        <p className="text-xs text-gray-500">Login email: {vendor.email}</p>
        <Button type="submit" loading={saving}>
          Save details
        </Button>
      </form>
    </Section>
  );
}

/** Stall photo + logo. They show on the customer menu, the QR posters and the dashboard. Saved right away. */
function ShopPhotos() {
  const { vendor, setVendor } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState('');

  const save = async (field, value) => {
    setSaving(field);
    try {
      const data = await api.patch('/vendor/profile', { [field]: value });
      setVendor(data.vendor);
      toast.success(value ? (field === 'cover' ? 'Stall photo updated 📸' : 'Logo updated') : 'Photo removed');
    } catch (err) {
      toast.error(err.message);
    }
    setSaving('');
  };

  return (
    <Section title="Stall photo & logo" description="Shown on your menu, your QR posters and here in the dashboard.">
      <div className="space-y-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            Stall photo {saving === 'cover' && <Spinner className="h-4 w-4" />}
          </p>
          <ImagePicker
            value={vendor.coverUrl}
            onChange={(v) => save('cover', v)}
            resize={{ maxSize: 1600, quality: 0.82 }}
            label="Add a photo of your stall, counter or best dish"
            className="h-44 w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          <ImagePicker
            value={vendor.logoUrl}
            onChange={(v) => save('logo', v)}
            resize={{ maxSize: 400, square: true }}
            shape="circle"
            label="Logo"
            className="h-24 w-24 shrink-0"
          />
          <div className="text-sm">
            <p className="flex items-center gap-2 font-medium text-gray-900">Logo {saving === 'logo' && <Spinner className="h-4 w-4" />}</p>
            <p className="text-gray-500">Square works best. It also appears in the middle of your QR codes.</p>
          </div>
        </div>

        {/* Mini preview of the customer menu header */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Customers see</p>
          <ShopCover src={vendor.coverUrl} className="h-28 rounded-2xl">
            <div className="flex h-full items-end gap-3 p-3">
              <ShopLogo src={vendor.logoUrl} name={vendor.shopName} className="h-12 w-12 border-2 text-base" />
              <p className="pb-1 font-display text-xl font-extrabold text-white drop-shadow">{vendor.shopName}</p>
            </div>
          </ShopCover>
        </div>
      </div>
    </Section>
  );
}

function PaymentSettings() {
  const { vendor, setVendor } = useAuth();
  const toast = useToast();
  const [paymentMode, setPaymentMode] = useState(null);

  useEffect(() => {
    api.get('/config').then((c) => setPaymentMode(c.paymentMode)).catch(() => {});
  }, []);

  const update = async (key, value) => {
    try {
      const data = await api.patch('/vendor/profile', { [key]: value });
      setVendor(data.vendor);
      toast.success('Payment options updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Section title="Payment options" description="Choose how customers can pay you. Keep at least one on.">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Banknote className="mt-0.5 h-5 w-5 text-gray-500" />
          <div className="flex-1">
            <Toggle
              label="Pay at counter"
              description="Cash or your own UPI QR, collected when you hand over the food"
              checked={vendor.acceptCounter}
              onChange={(v) => update('acceptCounter', v)}
            />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 text-gray-500" />
          <div className="flex-1">
            <Toggle
              label="Pay online"
              description="UPI, cards, wallets through Razorpay. Order reaches you only after payment succeeds."
              checked={vendor.acceptOnline}
              onChange={(v) => update('acceptOnline', v)}
            />
          </div>
        </div>
        {paymentMode === 'demo' && vendor.acceptOnline && (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <strong>Demo mode:</strong> no Razorpay keys are set on the server, so online payments are simulated and no real
            money moves. Add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> in <code>backend/.env</code> to
            take real payments.
          </p>
        )}
      </div>
    </Section>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vendor/password', form);
      toast.success('Password changed');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <Section title="Change password">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters"
          required
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        />
        <div>
          <Button type="submit" variant="secondary" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </Section>
  );
}

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Your shop, photos, payments and account" />
      <ShopPhotos />
      <ShopDetails />
      <PaymentSettings />
      <ChangePassword />
      <Button
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  );
}
