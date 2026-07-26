/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './hooks/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- EPIC ARENA design tokens: floodlit stadium at night ----
        stadium: {
          DEFAULT: '#0B1120', // near-black navy, the night sky / pitch shadow
          panel: '#121A2E',   // elevated card surface
          line: '#1E2A45',    // hairline borders
        },
        floodlight: '#F4F7FA', // primary text on dark
        gold: {
          DEFAULT: '#F5A623', // the auction paddle / hammer / bid accent
          soft: '#FFD37A',
        },
        turf: '#1F7A4D',      // pitch green - SOLD confirmations, success states
        danger: '#E5484D',    // countdown timer, urgent bidding window
        slate: {
          soft: '#8996AC',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(245, 166, 35, 0.45)',
        goldRing: '0 0 0 2px rgba(245, 166, 35, 0.8)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.25 },
        },
        floodgrid: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '80px 80px' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
        floodgrid: 'floodgrid 6s linear infinite',
      },
    },
  },
  plugins: [],
};
