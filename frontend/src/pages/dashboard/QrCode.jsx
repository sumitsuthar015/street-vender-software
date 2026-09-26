import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, Armchair, Check, CheckCircle2, Circle, Copy, Download, ExternalLink, Eye, Pencil, Plus, Printer, Store } from 'lucide-react';
import { QrPoster, downloadAsPng, menuLink, usePrint } from '../../components/QrPoster';
import { useToast } from '../../components/Toast';
import { Button, Card, EmptyState, Input, Modal, PageHeader, cx } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const fileSafe = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Copy this link:', text);
    }
  };
  return { copied, copy };
}

function useDownload() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const download = async (node, filename) => {
    setBusy(true);
    try {
      await downloadAsPng(node, filename);
      toast.success('Poster downloaded. Take it to any print shop 🖨️');
    } catch {
      toast.error('Could not create the image. Try "Print" instead.');
    }
    setBusy(false);
  };
  return { busy, download };
}

/* ------------------------------------------ Stall tab ------------------------------------------ */

function StallTab({ print }) {
  const { vendor } = useAuth();
  const posterRef = useRef(null);
  const { copied, copy } = useCopy();
  const { busy, download } = useDownload();
  const url = menuLink(vendor);

  const checklist = [
    { done: Boolean(vendor.coverUrl), label: 'Photo of your stall' },
    { done: Boolean(vendor.logoUrl), label: 'Shop logo' },
    { done: Boolean(vendor.description), label: 'A line about your food' },
    { done: Boolean(vendor.openingHours), label: 'Opening hours' },
    { done: Boolean(vendor.address), label: 'Address' },
  ];
  const missing = checklist.filter((c) => !c.done).length;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[auto_1fr]">
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        whileHover={{ rotate: -1, scale: 1.01 }}
        className="mx-auto"
      >
        <QrPoster ref={posterRef} shop={vendor} />
      </motion.div>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-gray-900">Stall poster</h2>
          <p className="mt-1 text-sm text-gray-500">Put this at your counter. Orders from it are for pickup at the counter.</p>
          <p className="mt-3 break-all rounded-xl bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-800">{url}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button loading={busy} onClick={() => download(posterRef.current, `${vendor.slug}-qr-poster.png`)}>
              <Download className="h-4 w-4" /> Download poster
            </Button>
            <Button variant="secondary" onClick={() => print(<div className="print-page"><QrPoster shop={vendor} /></div>)}>
              <Printer className="h-4 w-4" /> Print poster
            </Button>
            <Button variant="secondary" onClick={() => copy(url)}>
              {copied === url ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied === url ? 'Copied!' : 'Copy link'}
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-soft transition hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" /> See customer view
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">💡 Share the link on WhatsApp or Instagram too, so customers can order ahead.</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-gray-900">Make your poster shine ✨</h2>
            {missing === 0 && <span className="text-sm font-semibold text-green-700">All done!</span>}
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm">
                {c.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
                <span className={c.done ? 'text-gray-500' : 'font-medium text-gray-900'}>{c.label}</span>
              </li>
            ))}
          </ul>
          {missing > 0 && (
            <Link to="/dashboard/settings" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
              <Store className="h-4 w-4" /> Add photos & shop details
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------ Tables tab ------------------------------------------ */

/** "Table 7" -> 7. Used to continue numbering when adding several tables at once. */
function highestTableNumber(tables) {
  return tables.reduce((max, t) => {
    const match = /^table\s*(\d+)$/i.exec(t.name);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

function PosterModal({ table, onClose, print }) {
  const { vendor } = useAuth();
  const posterRef = useRef(null);
  const { busy, download } = useDownload();

  return (
    <Modal open={Boolean(table)} onClose={onClose} title={table ? `${table.name} poster` : ''}>
      {table && (
        <>
          <div className="flex justify-center">
            <QrPoster ref={posterRef} shop={vendor} table={table} compact className="shadow-none" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button loading={busy} onClick={() => download(posterRef.current, `${vendor.slug}-${fileSafe(table.name)}-qr.png`)}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="secondary" onClick={() => print(<div className="print-page"><QrPoster shop={vendor} table={table} /></div>)}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

function EditTableModal({ table, onClose }) {
  const { setVendor } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState('');

  // Fill the input whenever a (different) table is opened
  const [lastCode, setLastCode] = useState(null);
  if (table && table.code !== lastCode) {
    setLastCode(table.code);
    setName(table.name);
  } else if (!table && lastCode) {
    setLastCode(null);
  }

  const save = async (e) => {
    e.preventDefault();
    setBusy('save');
    try {
      const data = await api.patch(`/vendor/tables/${table.code}`, { name });
      setVendor(data.vendor);
      toast.success('Table renamed. The QR code stays the same.');
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
    setBusy('');
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${table.name}? Its printed QR code will stop working.`)) return;
    setBusy('delete');
    try {
      const data = await api.delete(`/vendor/tables/${table.code}`);
      setVendor(data.vendor);
      toast.success(`${table.name} deleted`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
    setBusy('');
  };

  return (
    <Modal open={Boolean(table)} onClose={onClose} title="Edit table" size="sm">
      <form onSubmit={save} className="space-y-4">
        <Input label="Table name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required hint="Renaming keeps the same QR code" />
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="danger" loading={busy === 'delete'} onClick={remove}>
            Delete
          </Button>
          <Button type="submit" loading={busy === 'save'}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TablesTab({ print }) {
  const { vendor, setVendor } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [posterFor, setPosterFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const tables = vendor.tables || [];

  const addTables = async (names) => {
    setAdding(true);
    try {
      const data = await api.post('/vendor/tables', { names });
      setVendor(data.vendor);
      setName('');
      toast.success(names.length > 1 ? `${names.length} tables added 🎉` : `${names[0]} added`);
    } catch (err) {
      toast.error(err.message);
    }
    setAdding(false);
  };

  const quickAdd = (count) => {
    const start = highestTableNumber(tables) + 1;
    addTables(Array.from({ length: count }, (_, i) => `Table ${start + i}`));
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">Table-wise QR codes</h2>
            <p className="mt-1 max-w-lg text-sm text-gray-500">
              Every table gets its own QR. When a customer orders from it, you see the table name on the order, so you know
              exactly where to serve.
            </p>
          </div>
          {tables.length > 0 && (
            <Button
              variant="dark"
              onClick={() =>
                print(
                  <div className="print-grid">
                    {tables.map((t) => (
                      <QrPoster key={t.code} shop={vendor} table={t} compact />
                    ))}
                  </div>
                )
              }
            >
              <Printer className="h-4 w-4" /> Print all ({tables.length})
            </Button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) addTables([name.trim()]);
          }}
          className="mt-4 flex flex-wrap gap-2"
        >
          <input
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 sm:text-sm"
            placeholder={`e.g. Table ${highestTableNumber(tables) + 1}, Rooftop 2, Family table`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            aria-label="New table name"
          />
          <Button type="submit" loading={adding} disabled={!name.trim()}>
            <Plus className="h-4 w-4" /> Add table
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Quick add:</span>
          {[5, 10].map((n) => (
            <button
              key={n}
              onClick={() => quickAdd(n)}
              disabled={adding}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-semibold text-brand-700 transition hover:bg-brand-100 active:scale-95 disabled:opacity-50"
            >
              + {n} tables
            </button>
          ))}
        </div>
      </Card>

      {!tables.length ? (
        <EmptyState
          emoji="🪑"
          title="No tables yet"
          text="Have seating? Add your tables above and print a QR for each one. No seating? Just use the stall poster."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence initial={false}>
            {tables.map((table, i) => (
              <motion.div
                key={table.code}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26, delay: Math.min(i * 0.02, 0.3) }}
              >
                <Card className="group flex h-full flex-col items-center p-4 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    <Armchair className="h-3 w-3" /> {table.name}
                  </span>
                  <button
                    onClick={() => setPosterFor(table)}
                    className="mt-3 rounded-2xl bg-white p-2 ring-1 ring-gray-100 transition group-hover:ring-brand-200"
                    aria-label={`Show ${table.name} poster`}
                  >
                    <QRCodeSVG value={menuLink(vendor, table)} size={104} fgColor="#1c1917" level="M" />
                  </button>
                  <p className="mt-1.5 font-mono text-[11px] text-gray-400">?table={table.code}</p>
                  <div className="mt-3 grid w-full grid-cols-2 gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setPosterFor(table)}>
                      <Eye className="h-3.5 w-3.5" /> Poster
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(table)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PosterModal table={posterFor} onClose={() => setPosterFor(null)} print={print} />
      <EditTableModal table={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/* --------------------------------------------- Page --------------------------------------------- */

export default function QrCodePage() {
  const { vendor } = useAuth();
  const [tab, setTab] = useState('stall');
  const { print, portal } = usePrint();
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const tabs = [
    ['stall', 'Stall poster', Store],
    ['tables', `Tables (${vendor.tables?.length || 0})`, Armchair],
  ];

  return (
    <div>
      <PageHeader
        title="QR codes"
        subtitle="Print them, stick them up, and customers order by scanning."
        action={
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-soft ring-1 ring-gray-100">
            {tabs.map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cx('relative inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition', tab === key ? 'text-white' : 'text-gray-600')}
              >
                {tab === key && (
                  <motion.span layoutId="qr-tab" className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500 to-rose-500 shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        }
      />

      {isLocalhost && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            You opened this site as <strong>localhost</strong>, which only works on this computer, so phones can't open these
            QR codes. To test with a phone on the same Wi-Fi, open the dashboard using the <strong>Network</strong> address
            shown in the terminal (like <code>http://192.168.1.5:5173</code>). Once the site is online, print from your real
            website address.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {tab === 'stall' ? <StallTab print={print} /> : <TablesTab print={print} />}
        </motion.div>
      </AnimatePresence>
      {portal}
    </div>
  );
}
