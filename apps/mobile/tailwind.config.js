/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        green: {
          900: '#0d2618',
          800: '#163d26',
          700: '#1e5435',
          600: '#276945',
          500: '#2d7a4f',
          400: '#3d9e67',
          300: '#5ec287',
          200: '#9eddb9',
          100: '#cff0df',
          50:  '#eaf7f1',
        },
        cream: '#f5f2eb',
        warm:  '#ede8de',
        amber: {
          DEFAULT: '#d4820a',
          light:   '#fdf0d5',
        },
        rose: {
          DEFAULT: '#c4446a',
          light:   '#fce8ef',
        },
      },
    },
  },
  plugins: [],
};
