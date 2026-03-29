/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        journeyBg: '#FAFAFA',
        journeyAccent: '#14B8A6', // Teal 500
        journeyText: '#334155', // Slate 700 
        journeyMuted: '#94A3B8', // Slate 400
        journeyBorder: '#F1F5F9', // Slate 100
        journeyCard: '#FFFFFF', // White backgrounds
      }
    },
  },
  plugins: [],
}
