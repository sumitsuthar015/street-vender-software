import React from 'react';
import { X, Printer, Store, CheckCircle, Download } from 'lucide-react';

export const DigitalInvoiceModal = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl z-10 border border-slate-200 space-y-6 print:p-0 print:shadow-none print:border-none">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <CheckCircle className="w-5 h-5" /> Official Digital Invoice
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div id="invoice-printable" className="space-y-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <div className="flex justify-center items-center gap-2 text-orange-600 font-extrabold text-lg">
              <Store className="w-6 h-6" /> {invoice.vendor?.name}
            </div>
            <p className="text-slate-500 font-medium">{invoice.vendor?.address}, {invoice.vendor?.city}</p>
            <p className="text-[10px] text-slate-400">UPI Payments Accepted • Smart Street Vendor Network</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Invoice No</span>
              <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Number</span>
              <span className="font-bold text-orange-600">{invoice.orderNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date & Time</span>
              <span className="font-medium text-slate-700">{invoice.date}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Type</span>
              <span className="font-medium text-slate-700">{invoice.orderType} {invoice.tableNo !== 'N/A' && `(Table ${invoice.tableNo})`}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">Itemized Bill</h4>
            <div className="divide-y divide-slate-100 border-t border-b border-slate-200 py-1">
              {invoice.items?.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900">{item.name} × {item.quantity}</span>
                    {item.customizations && (
                      <p className="text-[10px] text-slate-500">{item.customizations}</p>
                    )}
                  </div>
                  <span className="font-bold text-slate-900">₹{item.totalPrice}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 pt-2 text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">₹{invoice.subtotal}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-₹{invoice.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Final Paid Amount</span>
              <span className="text-orange-600">₹{invoice.finalAmount}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Payment Mode: {invoice.paymentMethod}</span>
              <span className="font-bold text-emerald-600">STATUS: {invoice.paymentStatus}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-4 border-t border-dashed border-slate-200 text-slate-400 text-[10px]">
            Thank you for supporting local street food artisans! ❤️
          </div>
        </div>
      </div>
    </div>
  );
};
