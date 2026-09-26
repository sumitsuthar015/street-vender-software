import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-rose-50 px-4 text-center">
      <motion.p
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="text-8xl"
      >
        🍽️
      </motion.p>
      <h1 className="mt-4 font-display text-4xl font-extrabold text-gray-900">Oops, empty plate!</h1>
      <p className="mt-2 max-w-sm text-gray-600">This page doesn't exist. If you were opening a shop menu, please scan the shop's QR code again.</p>
      <Link to="/" className="mt-6 rounded-2xl bg-gradient-to-r from-brand-500 to-rose-500 px-6 py-3 font-bold text-white shadow-glow transition hover:-translate-y-0.5">
        Go to home page
      </Link>
    </div>
  );
}
