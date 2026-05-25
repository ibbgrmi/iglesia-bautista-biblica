/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ["'Cormorant Garamond'", 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Matches the navy/gold palette established in plan-salvacion so the
        // visual identity carries over once /salvacion is absorbed here.
        navy: {
          950: '#070d1c',
          900: '#0a1226',
          800: '#101a35',
          700: '#172447',
        },
        gold: {
          300: '#f6d98a',
          400: '#eec46a',
          500: '#d9a441',
        },
      },
    },
  },
  plugins: [],
};
