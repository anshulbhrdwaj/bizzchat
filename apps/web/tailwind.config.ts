import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        // WhatsApp exact palette
        wa: {
          'teal-dark': '#075E54',
          'teal': '#128C7E',
          'green': '#25D366',
          'light-green': '#DCF8C6',
          'blue': '#34B7F1',
          'red': '#EA0038',
          'chat-bg': '#EFEAE2',
          'bubble-out': '#D9FDD3',
          'bubble-in': '#FFFFFF',
        },
        // Legacy aliases for CSS var references
        primary: {
          DEFAULT: '#128C7E',
          mid: '#075E54',
          light: 'rgba(18, 140, 126, 0.08)',
        },
        success: '#25D366',
        warning: '#F1C40F',
        error: '#EA0038',
        info: '#34B7F1',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'typing-pulse': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-3px)', opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 200ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'typing-pulse': 'typing-pulse 1.4s ease-in-out infinite',
        'slide-up': 'slide-up 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
