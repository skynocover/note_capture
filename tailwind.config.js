/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./entrypoints/popup/index.html', './entrypoints/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
};
