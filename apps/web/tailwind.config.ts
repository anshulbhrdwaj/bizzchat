import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Variable', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono Variable', 'monospace'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        'h1':      ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        'h2':      ['15px', { lineHeight: '1.4', fontWeight: '600' }],
        'h3':      ['12px', { lineHeight: '1.4', fontWeight: '600' }],
        'body':    ['11px', { lineHeight: '1.5', fontWeight: '400' }],
        'small':   ['10px', { lineHeight: '1.4', fontWeight: '400' }],
        'micro':   ['9px',  { lineHeight: '1.3', fontWeight: '500' }],
      },
      colors: {
        primary: {
          DEFAULT: '#5B3FD9',
          mid: '#7B5FE8',
          light: '#EDE9FF',
        },
        accent: {
          cyan: '#0891B2',
        },
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#0891B2',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'typing-pulse': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(60px) rotate(360deg)', opacity: '0' },
        },
        'checkmark-draw': {
          from: { strokeDashoffset: '100' },
          to: { strokeDashoffset: '0' },
        },
        'badge-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 300ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
        'typing-pulse': 'typing-pulse 1.4s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 300ms ease-out',
        'confetti-fall': 'confetti-fall 600ms ease-out forwards',
        'checkmark-draw': 'checkmark-draw 400ms ease-out forwards',
        'badge-bounce': 'badge-bounce 400ms ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
} satisfies Config
