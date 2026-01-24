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
        // Dark theme colors
        background: {
          DEFAULT: '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary: '#242424',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
        },
        text: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.8)',
          muted: 'rgba(255, 255, 255, 0.5)',
        },
        accent: {
          DEFAULT: '#3ecf8e',
          hover: '#2fb87a',
          muted: 'rgba(62, 207, 142, 0.1)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-out',
      },
    },
  },
  plugins: [],
}
export default config
