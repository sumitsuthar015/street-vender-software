import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, QrCode } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, targetUrl, title = 'Scan & Order' }) => {
  if (!isOpen || !targetUrl) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 border border-slate-100 text-center space-y-5 print:shadow-none">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 print:hidden">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
          <p className="text-xs text-slate-500">Scan with any smartphone camera to open the menu</p>
        </div>

        {/* QR Rendering Container */}
        <div className="bg-gradient-to-b from-orange-500 to-amber-600 p-6 rounded-3xl shadow-lg inline-block my-2 border-4 border-white">
          <div className="bg-white p-4 rounded-2xl shadow-inner">
            <QRCodeSVG
              value={targetUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-white text-[10px] font-bold tracking-widest uppercase mt-3">Smart Street Vendor</p>
        </div>

        <p className="text-[11px] text-slate-400 break-all font-mono bg-slate-50 p-2 rounded-xl border border-slate-100">
          {targetUrl}
        </p>

        {/* Print / Download Button */}
        <div className="flex gap-2 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
          >
            <Printer className="w-4 h-4" /> Print QR Poster
          </button>
        </div>
      </div>
    </div>
  );
};
