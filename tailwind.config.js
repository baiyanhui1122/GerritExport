/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        mist: '#f4f7fb',
        brand: '#1f9fb4',
        accent: '#3b82f6'
      },
      boxShadow: {
        soft: '0 18px 55px rgba(26, 41, 61, 0.08)'
      }
    }
  },
  plugins: []
}
