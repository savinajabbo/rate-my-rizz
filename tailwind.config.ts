import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          300: '#ff9a8b',
          400: '#ff7961',
          500: '#ff5722',
          600: '#e64a19',
        },
        sand: {
          50: '#fefdfb',
          100: '#fdf8f0',
          200: '#f9ede0',
          300: '#f4dfc7',
          400: '#edc9a3',
          500: '#d4a574',
        },
      },
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        'romantic': ['Crimson Text', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config

