/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        espresso: {
          950: '#0c0907',
          900: '#140f0c',
          850: '#18120e',
          800: '#221a14',
          700: '#2e231c',
          600: '#423328',
          500: '#5c4738',
          400: '#7d6350',
          300: '#a38771',
          200: '#ccb6a3',
          100: '#ebdcd0',
          50: '#f8f3ee',
        },
        bone: '#f5ede4',
        taupe: '#9e8f82',
        sage: '#7ec29a',
        terracotta: '#e07a68',
        honey: '#d99b5a',
        brand: {
          50: '#fdf9f4',
          100: '#f9f1e8',
          200: '#f1dfcc',
          300: '#e5c5a7',
          400: '#d7a67e',
          500: '#c88d51',
          600: '#b47741',
          700: '#945d36',
          800: '#774b30',
          900: '#623f2a',
        }
      }
    },
  },
  plugins: [],
}
