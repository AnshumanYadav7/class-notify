import type { Config } from 'tailwindcss'

const config: Config = {
  // Enable class-based dark mode
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Define custom font families
      fontFamily: {
        heading: ['var(--font-orbitron)', 'sans-serif'],
        body: ['var(--font-exo2)', 'sans-serif'],
      },
      // Define your custom color palettes
      colors: {
        // Light Mode Palette
        light: {
          background: '#f7f9fa', // Off-white for less harshness
          card: '#ffffff',
          text: '#1D333E',      // Charcoal
          primary: '#725446',   // Puce
          'primary-hover': '#5a4338',
          accent: '#E2CEB6',    // Peach
          subtle: '#ACC6C7',    // Misty Blue
        },
        // Dark Mode Palette
        dark: {
          background: '#1A3239', // Navy Blue
          card: '#213349',     // Dark Blue
          text: '#E7D5C2',     // Champagne
          primary: '#1181C8',   // Blue Grotto
          'primary-hover': '#0d6aA3',
          accent: '#E7D5C2',   // Champagne
        },
        // Pastel Status Colors (HCI friendly)
        status: {
          open: {
            text: '#065f46', // green-800
            bg: '#a7f3d0',   // green-200
            border: '#34d399', // green-400
          },
          full: {
            text: '#991b1b', // red-800
            bg: '#fecaca',   // red-200
            border: '#f87171', // red-400
          },
        },
      },
      boxShadow: {
        'glow-light': '0 0 15px rgba(172, 198, 199, 0.4)',
        'glow-dark': '0 0 15px rgba(17, 129, 200, 0.3)',
      }
    },
  },
  plugins: [],
}
export default config