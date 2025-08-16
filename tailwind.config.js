/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'diff-add': '#22c55e',
        'diff-remove': '#ef4444',
        'diff-modify': '#3b82f6',
        'diff-add-bg': '#dcfce7',
        'diff-remove-bg': '#fee2e2',
        'diff-modify-bg': '#dbeafe',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}