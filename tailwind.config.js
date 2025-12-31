/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        blue: {
          50: '#e6f2ff',
          100: '#cce5ff',
          200: '#99ccff',
          300: '#66b3ff',
          400: '#4da6ff',
          500: '#3399ff',
          600: '#0066cc',
          700: '#0052a3',
          800: '#003d7a',
          900: '#002952',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      animation: {
        'reveal': 'reveal 0.8s ease-out forwards',
        'float-1': 'float-1 25s ease-in-out infinite',
        'float-2': 'float-2 30s ease-in-out infinite',
        'float-3': 'float-3 35s ease-in-out infinite',
        'sheen': 'sheen 10s infinite',
      },
      keyframes: {
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(10%, 15%) scale(1.1)' },
          '50%': { transform: 'translate(5%, 25%) scale(0.9)' },
          '75%': { transform: 'translate(-5%, 10%) scale(1.05)' },
        },
        'float-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-15%, 10%) scale(1.15)' },
          '66%': { transform: 'translate(10%, -10%) scale(0.85)' },
        },
        'float-3': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(-10%, 20%) rotate(180deg)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-100%)' },
          '20%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
