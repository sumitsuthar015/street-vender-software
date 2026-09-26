/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Friendly rounded headings (shop names, big titles)
        display: ['"Baloo 2"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 30px -10px rgba(234, 88, 12, 0.55)',
        soft: '0 2px 12px -2px rgba(15, 23, 42, 0.08)',
        lift: '0 18px 40px -16px rgba(15, 23, 42, 0.25)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          from: { backgroundPosition: '-400px 0' },
          to: { backgroundPosition: '400px 0' },
        },
        steam: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0' },
          '30%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-26px) scaleX(1.6)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(6deg)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(59, 130, 246, 0)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        marquee: 'marquee 35s linear infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        steam: 'steam 2.2s ease-out infinite',
        wiggle: 'wiggle 1.2s ease-in-out infinite',
        glow: 'glow 1.8s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [],
};
