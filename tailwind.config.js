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
        primary: {
          50: '#fef7e6',
          100: '#fdecc0',
          200: '#fbdf96',
          300: '#f9d26c',
          400: '#f7c84d',
          500: '#f5be2e',
          600: '#f0a929',
          700: '#e98f22',
          800: '#e2761c',
          900: '#d65311',
        },
        'dark-bg': '#0a0a0a',
        'dark-surface': '#141414',
        'dark-border': '#2a2a2a',
        'dark-text': '#f0f0f0',
        'dark-muted': '#888888',
      },
    },
  },
  plugins: [],
}
