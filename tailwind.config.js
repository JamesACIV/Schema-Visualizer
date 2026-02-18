/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#141414',
          border: '#2a2a2a',
          text: '#e5e5e5',
          muted: '#737373',
          hover: '#1f1f1f',
        },
        accent: {
          blue: '#3b82f6',
          amber: '#f59e0b',
          purple: '#8b5cf6',
          line: '#525252',
        }
      }
    },
  },
  plugins: [],
}
