/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // class-based dark mode
  theme: {
    extend: {
      colors: {
        yellow: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: {
          // dark mode surfaces
          950: '#0c0a09',
          900: '#1c1917',
          800: '#292524',
          700: '#44403c',
          // light mode surfaces
          50:  '#fffbeb',
          100: '#fef9ee',
          200: '#fef3c7',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float':        'float 7s ease-in-out infinite',
        'float-slow':   'float 10s ease-in-out 2s infinite',
        'shimmer':      'shimmer 3s linear infinite',
        'fade-up':      'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'gradient-pan': 'gradientPan 12s ease infinite',
        'bounce-soft':  'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%':     { transform: 'translateY(-18px) rotate(1deg)' },
          '66%':     { transform: 'translateY(8px) rotate(-1deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        gradientPan: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
        bounceSoft: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
      },
      backgroundSize: { '300%': '300% 300%' },
      boxShadow: {
        'yellow-glow':  '0 0 30px rgba(245,158,11,0.25)',
        'yellow-glow-lg': '0 0 60px rgba(245,158,11,0.3)',
        'card':         '0 4px 24px rgba(0,0,0,0.08)',
        'card-dark':    '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
