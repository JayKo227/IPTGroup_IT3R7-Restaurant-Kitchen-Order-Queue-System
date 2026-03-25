/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        kitchen: {
          bg: '#0f0e0c',
          surface: '#1a1815',
          card: '#211f1b',
          border: '#2e2b25',
          accent: '#f97316',
          'accent-dim': '#c2601a',
          gold: '#f5c842',
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
          muted: '#6b6660',
          text: '#e8e2d9',
          'text-dim': '#9d9690',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
