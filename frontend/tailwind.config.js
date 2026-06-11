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
        // Foreground scale — light, for a dark canvas.
        ink: {
          DEFAULT: '#eef2f8',
          soft: '#aeb9cc',
          mute: '#6b7689',
        },
        accent: {
          blue: '#3aa0ff',
          green: '#3ddc6a',
          red: '#ff5277',
          orange: '#ffab3d',
          purple: '#9b7bff',
          teal: '#2bd9d9',
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 10px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.14)',
        'glass-sm': '0 4px 18px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-lg': '0 30px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
        glow: '0 0 0 1px rgba(58,160,255,0.40), 0 10px 30px rgba(58,160,255,0.30)',
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
