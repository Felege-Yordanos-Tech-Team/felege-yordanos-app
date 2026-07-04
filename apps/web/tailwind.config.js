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
        headline: ['Cormorant Garamond', 'Noto Serif Ethiopic', 'serif'],
        body: ['Inter', 'Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Noto Serif Ethiopic', 'serif'],
        label: ['Inter', 'system-ui', 'sans-serif'],
        ethiopic: ['Noto Serif Ethiopic', 'Noto Sans Ethiopic', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
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

        /* Ethiopian Orthodox palette — direct refs for hand-tuned screens */
        burgundy: {
          DEFAULT: '#6B1D2A',
          soft: '#8B2F3F',
          deep: '#4A0E18',
          ink: '#2C0810',
          legacy: '#601924', /* the previous header burgundy — still in use */
        },
        gold: {
          DEFAULT: '#D4A843',
          deep: '#A47A18', /* AAA contrast on parchment */
          light: '#E8C77B',
          faint: '#F4E2A5',
          legacy: '#735c00', /* the previous gold — still in use */
          bright: '#fed65b', /* previous accent — still in use */
        },
        parchment: {
          DEFAULT: '#F7EEDA',
          soft: '#FBF6E4',
          deep: '#EFE2BE',
          edge: '#E5D6AC',
        },
        cream: {
          DEFAULT: '#FEF9EA',
          dim: 'rgba(254, 249, 234, 0.72)',
        },
        ink: {
          DEFAULT: '#2A1F12',
          muted: '#75664A',
          faint: '#A89673',
        },
        status: {
          present: '#4F7B3E',
          'present-bg': '#E4EED9',
          absent: '#A12831',
          'absent-bg': '#F2D8DA',
          late: '#C97B1A',
          'late-bg': '#F6E3C5',
        },
        navy: '#1A2744',
      },
      borderRadius: {
        /* Reserved, consistent scale — driven by the --radius-* tokens in
           global.css. Change roundedness there, not per-component. */
        none: '0px',
        sm: 'var(--radius-sm)', /* 4px  — tags, chips */
        DEFAULT: 'var(--radius-md)', /* 8px  — controls */
        md: 'var(--radius-md)', /* 8px  — buttons, controls */
        lg: 'var(--radius-lg)', /* 10px — cards, panels */
        xl: 'var(--radius-xl)', /* 14px — CTAs, larger cards */
        '2xl': 'var(--radius-2xl)', /* 16px — feature cards */
        '3xl': 'var(--radius-3xl)', /* 20px — hero banners */
        full: '9999px',
        arch: '200px 200px 0 0', /* arched top for hero panels */
      },
      boxShadow: {
        'fy-sm': '0 1px 0 rgba(74, 14, 24, 0.04), 0 1px 2px rgba(74, 14, 24, 0.06)',
        'fy-md': '0 4px 16px -4px rgba(74, 14, 24, 0.10), 0 2px 4px rgba(74, 14, 24, 0.06)',
        'fy-lg': '0 16px 40px -16px rgba(74, 14, 24, 0.28), 0 4px 8px rgba(74, 14, 24, 0.06)',
        'fy-gold': '0 6px 20px -6px rgba(212, 168, 67, 0.45)',
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
