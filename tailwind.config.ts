import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#030507',
        base: '#080b10',
        card: '#0d1117',
        elevated: '#131920',
        hover: '#1a2230',
        subtle: '#1a2535',
        default: '#243044',
        focus: '#3b82f6',
        blue: '#3b82f6',
        indigo: '#6366f1',
        violet: '#8b5cf6',
        emerald: '#10b981',
        rose: '#f43f5e',
        amber: '#f59e0b',
        primary: '#f1f5f9',
        secondary: '#94a3b8',
        tertiary: '#4a5568',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sharp: '4px',
        DEFAULT: '8px',
        card: '12px',
        modal: '16px',
        pill: '24px',
      },
      boxShadow: {
        glass: '0 0 0 1px rgba(255,255,255,0.03), 0 8px 40px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(99,102,241,0.15)',
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite linear',
        mesh: 'mesh 16s ease-in-out infinite alternate',
        bounceDots: 'bounceDots 1s infinite ease-in-out',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        mesh: { '0%': { transform: 'translate3d(-2%, -1%, 0) scale(1)' }, '100%': { transform: 'translate3d(2%, 1%, 0) scale(1.05)' } },
        bounceDots: { '0%,80%,100%': { opacity: '.35', transform: 'translateY(0)' }, '40%': { opacity: '1', transform: 'translateY(-4px)' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
