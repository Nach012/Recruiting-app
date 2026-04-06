/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            primary: '#2e509e',
            dark: '#182643',
          },
          sky: '#89c0df',
          lime: '#dbde5c',
        }
      },
      fontFamily: {
        display: ['"Funnel Display"', 'sans-serif'],
        body: ['"Inter Tight"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

