import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Plus, Trash2, Printer, Store, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { vendorService } from '../services/api';
import { QRScannerModal } from '../components/QRScannerModal';

export const VendorQRPage = () => {
  const { vendor } = useAuth();
  const [tables, setTables] = useState([]);
  const [tableNoInput, setTableNoInput] = useState('');
  const [capacityInput, setCapacityInput] = useState(4);
  const [loading, setLoading] = useState(true);

  // QR Modal Launcher State
  const [selectedQRUrl, setSelectedQRUrl] = useState('');
  const [selectedQRTitle, setSelectedQRTitle] = useState('');

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getVendorTables();
      if (res.success) {
        setTables(res.data || []);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!tableNoInput.trim()) return;

    try {
      await vendorService.createVendorTable({
        tableNo: tableNoInput.trim(),
        capacity: capacityInput
      });
      setTableNoInput('');
      fetchTables();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Delete this table QR code?')) return;
    try {
      await vendorService.deleteVendorTable(tableId);
      fetchTables();
    } catch (err) {
      alert(err.message);
    }
  };

  const baseUrl = window.location.origin;
  const stallQrUrl = `${baseUrl}/vendor/${vendor?._id}`;

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">QR Code Generator & Table Management</h1>
        <p className="text-xs text-slate-500">Generate high-resolution printable QR codes for your stall and individual tables</p>
      </div>

      {/* Main Stall Storefront QR Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-md">
          <span className="bg-orange-500/20 text-orange-400 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider border border-orange-500/30">
            Official Stall QR Code
          </span>
          <h2 className="text-2xl font-extrabold">{vendor?.stallName}</h2>
          <p className="text-xs text-slate-300">
            Display this QR poster at your counter or entrance. Customers scanning this will open your digital menu directly without searching!
          </p>

          <button
            onClick={() => {
              setSelectedQRUrl(stallQrUrl);
              setSelectedQRTitle(`Stall QR - ${vendor?.stallName}`);
            }}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow transition"
          >
            <Printer className="w-4 h-4" /> Print Full Counter Poster
          </button>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-white/20 shrink-0">
          <QRCodeSVG value={stallQrUrl} size={150} level="H" includeMargin={true} />
        </div>
      </div>

      {/* Table-Specific QR Generator Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Table-Specific QR Codes</h3>
            <p className="text-xs text-slate-500">Orders placed via table QRs automatically display the Table # on kitchen dashboard</p>
          </div>

          <form onSubmit={handleCreateTable} className="flex gap-2">
            <input
              type="text"
              placeholder="Table No (e.g. T-01)"
              required
              value={tableNoInput}
              onChange={(e) => setTableNoInput(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold w-36"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Table Cards Grid */}
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading table QR codes...</div>
        ) : tables.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Utensils className="w-10 h-10 mx-auto text-slate-300" />
            <p>No tables configured. Add table numbers above to generate table-specific QR stickers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tables.map((tbl) => {
              const tableQrUrl = `${baseUrl}/vendor/${vendor?._id}/table/${tbl.tableNo}`;
              return (
                <div key={tbl._id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center space-y-3 relative group">
                  <button
                    onClick={() => handleDeleteTable(tbl._id)}
                    className="absolute top-3 right-3 p-1 text-slate-300 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                    <QRCodeSVG value={tableQrUrl} size={110} level="H" />
                  </div>

                  <div className="text-center">
                    <span className="font-extrabold text-slate-900 text-sm">Table #{tbl.tableNo}</span>
                    <p className="text-[10px] text-slate-400 font-medium">Capacity: {tbl.capacity} Seats</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedQRUrl(tableQrUrl);
                      setSelectedQRTitle(`Table #${tbl.tableNo} - ${vendor?.stallName}`);
                    }}
                    className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-1.5 rounded-xl border border-slate-200 transition flex items-center justify-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5 text-orange-600" /> Print Sticker
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Printable Modal */}
      {selectedQRUrl && (
        <QRScannerModal
          targetUrl={selectedQRUrl}
          title={selectedQRTitle}
          isOpen={Boolean(selectedQRUrl)}
          onClose={() => setSelectedQRUrl('')}
        />
      )}
    </div>
  );
};
