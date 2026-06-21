/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./auth.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        garamond: ['"EB Garamond"', 'serif'],
      },
      colors: {
        background: 'var(--bg-main)',
        white: 'rgb(var(--color-white-rgb) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          glow: 'rgb(var(--color-primary-glow-rgb) / <alpha-value>)',
        },
        adventure: {
          orange: '#FF6B35',
          green: '#1B4332',
          earth: '#8B5A2B',
          sky: '#87CEEB',
        }
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
