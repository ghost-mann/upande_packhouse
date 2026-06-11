/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Inter',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          DEFAULT: '#0b1220',
          soft: '#475569',
          mute: '#94a3b8',
        },
        accent: {
          blue: '#2490ef',
          green: '#29cd42',
          red: '#e63757',
          orange: '#fc9c30',
          purple: '#7c5cfc',
          teal: '#16c8c8',
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
        'glass-sm': '0 2px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
        'glass-lg': '0 20px 60px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255,255,255,0.6)',
        glow: '0 0 0 1px rgba(36,144,239,0.25), 0 8px 24px rgba(36,144,239,0.18)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(0, -16px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
