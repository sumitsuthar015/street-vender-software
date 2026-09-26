export const APP_NAME = 'StreetMenu';

export function rupees(amount) {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function compactRupees(amount) {
  const value = Number(amount) || 0;
  // +x.toFixed(1) drops a trailing ".0": 1.0L -> 1L
  if (value >= 100000) return `₹${+(value / 100000).toFixed(1)}L`;
  if (value >= 10000) return `₹${+(value / 1000).toFixed(1)}K`;
  return rupees(value);
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function clockTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function dateTime(date) {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const ORDER_STATUS = {
  awaiting_payment: { label: 'Awaiting payment', badge: 'bg-amber-100 text-amber-800' },
  placed: { label: 'New order', badge: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'Preparing', badge: 'bg-brand-100 text-brand-800' },
  ready: { label: 'Ready', badge: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', badge: 'bg-gray-100 text-gray-700' },
  rejected: { label: 'Rejected', badge: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-700' },
};

export const PAYMENT_STATUS = {
  pending: 'Not paid yet',
  paid: 'Paid',
  refunded: 'Refunded',
  refund_pending: 'Refund in progress',
};

export function paymentLabel(order) {
  if (order.paymentStatus === 'paid') {
    return order.payment?.provider === 'cash' ? 'Paid in cash' : 'Paid online';
  }
  if (order.paymentStatus === 'pending') {
    return order.paymentMethod === 'counter' ? 'Pay at counter' : 'Online payment pending';
  }
  return PAYMENT_STATUS[order.paymentStatus];
}

export const itemCount = (items) => items.reduce((sum, i) => sum + i.qty, 0);
