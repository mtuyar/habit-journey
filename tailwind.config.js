/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        journeyBg: '#F0FDFA',       // Teal 50 — warm, breathing base
        journeyAccent: '#0D9488',   // Teal 600 — richer, more premium
        journeyText: '#134E4A',     // Teal 950 — cohesive dark text
        journeyMuted: '#5F8B8A',    // Muted teal
        journeyBorder: '#B2F0E8',   // Teal 200 — visible but soft
        journeyCard: '#FFFFFF',     // Clean white
        journeyGold: '#F59E0B',     // Amber — streak & achievements
        journeySuccess: '#059669',  // Emerald — completed states
        // Dark mode
        journeyDarkBg: '#021a19',
        journeyDarkCard: '#0a2c2a',
        journeyDarkBorder: '#134e4a',
        journeyDarkText: '#CCFBF1',
      }
    },
  },
  plugins: [],
}
