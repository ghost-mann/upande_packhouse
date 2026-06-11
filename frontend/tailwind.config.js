/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Neutral foreground scale (Frappe CRM greys).
        ink: {
          DEFAULT: '#171717',
          soft: '#525252',
          mute: '#999999',
        },
        line: '#ededed', // hairline borders (gray-200)
        canvas: '#f6f7f9', // page background
        accent: {
          blue: '#2f6fed',
          green: '#22a45d',
          red: '#ef4444',
          orange: '#f59e0b',
          purple: '#7c5cfc',
          teal: '#06b6d4',
        },
      },
      borderRadius: {
        '2.5xl': '0.875rem',
        '4xl': '1.25rem',
      },
      boxShadow: {
        glass: '0 1px 2px rgba(17,17,17,0.04), 0 1px 3px rgba(17,17,17,0.06)',
        'glass-sm': '0 1px 2px rgba(17,17,17,0.05)',
        'glass-lg': '0 8px 24px rgba(17,17,17,0.10), 0 2px 6px rgba(17,17,17,0.06)',
        glow: '0 1px 2px rgba(47,111,237,0.20), 0 0 0 1px rgba(47,111,237,0.10)',
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
