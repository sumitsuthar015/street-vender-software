import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { APP_NAME } from '../lib/format';

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-rose-500 text-white shadow-glow transition group-hover:-rotate-6 group-hover:scale-105">
        <ShoppingBag className="h-5 w-5" />
      </span>
      <span className={`font-display text-2xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>{APP_NAME}</span>
    </Link>
  );
}
