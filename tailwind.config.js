/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#C77DFF',
          DEFAULT: '#7B2CBF',
          dark: '#5A189A',
        },
        background: {
          light: '#F8F9FA',
          DEFAULT: '#FFFFFF',
          dark: '#0F172A',
        },
        text: {
          title: '#1E293B',
          body: '#475569',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
        }
      },
    },
  },
  plugins: [],
}
