/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#0f172a',
        glasscard: 'rgba(30, 41, 59, 0.7)',
        neonaccent: '#38bdf8',
        availableGreen: '#22c55e',
        occupiedRed: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
