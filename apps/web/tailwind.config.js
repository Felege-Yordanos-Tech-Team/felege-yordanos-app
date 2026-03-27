/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './lib/**/*.{ts,tsx,js,jsx}',
    '../../libs/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        headline: ['Noto Sans Ethiopic', 'Manrope', 'sans-serif'],
        body: ['Noto Sans Ethiopic', 'Manrope', 'sans-serif'],
        sans: ['Noto Sans Ethiopic', 'Manrope', 'sans-serif'],
        display: ['Noto Sans Ethiopic', 'Manrope', 'sans-serif'],
        label: ['Noto Sans Ethiopic', 'Manrope', 'sans-serif'],
        ethiopic: ['Noto Sans Ethiopic', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          container: 'hsl(var(--primary-container))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          container: 'hsl(var(--secondary-container))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'surface-container': 'hsl(var(--surface-container))',
        'surface-container-low': 'hsl(var(--surface-container-low))',
        'surface-container-high': 'hsl(var(--surface-container-high))',
        'outline-variant': 'hsl(var(--outline-variant))',
        gold: {
          DEFAULT: '#735c00',
          light: '#e9c349',
          bright: '#fed65b',
        },
        burgundy: {
          DEFAULT: '#430310',
          light: '#601924',
        },
        navy: '#1A2744',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        lg: '1rem',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1.5rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
