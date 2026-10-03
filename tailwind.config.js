/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tuammai: {
          dark: '#0B1120',
          card: '#0F172A',
          border: '#1E293B',
          water: '#0284C7',
          cyan: '#06B6D4',
          critical: '#EF4444',
          warning: '#F59E0B',
          normal: '#10B981',
          clay: '#94A3B8',
          clayHighlight: '#38BDF8'
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
