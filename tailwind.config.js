/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-8px)' },
          '40%,80%': { transform: 'translateX(8px)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        shake: 'shake 0.45s ease-in-out',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
