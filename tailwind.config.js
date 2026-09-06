/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          blue: "#3b82f6",
          green: "#10b981",
          purple: "#8b5cf6",
          orange: "#f97316",
          red: "#ef4444",
          yellow: "#eab308",
          pink: "#ec4899",
          bg: "#f8fafc",
        }
      },
      animation: {
        'bounce-subtle': 'bounce 0.5s ease-in-out 1',
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(4px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-6px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(6px, 0, 0)' }
        }
      }
    },
  },
  plugins: [],
}
