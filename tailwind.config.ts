import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#96298d',
          yellow: '#f6ab2d',
          soft: '#f7f5ff',
          deep: '#392b75',
          light: '#e8d5e7',
        },
      },
    },
  },
  plugins: [],
}

export default config