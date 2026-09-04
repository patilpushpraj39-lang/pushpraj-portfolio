/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#F7F4EF',
          elevated: '#FFFFFF',
          subtle: '#EDE8E0',
          deep: '#E8E2D6',
        },
        ink: {
          DEFAULT: '#1A1814',
          secondary: '#5C5650',
          muted: '#8A847C',
          faint: '#B5AFA6',
        },
        accent: {
          DEFAULT: '#A0764E',
          hover: '#8A6438',
          subtle: 'rgba(160, 118, 78, 0.08)',
          glow: 'rgba(160, 118, 78, 0.12)',
        },
        success: '#6B8E5A',
        warning: '#C49A4A',
        error: '#B85C4A',
        hairline: 'rgba(26, 24, 20, 0.08)',
        'hairline-strong': 'rgba(26, 24, 20, 0.14)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['clamp(3rem, 9vw, 7rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        h1: ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        h2: ['clamp(1.375rem, 2.8vw, 2.25rem)', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        h3: ['clamp(1.125rem, 1.8vw, 1.625rem)', { lineHeight: '1.35', letterSpacing: '-0.012em' }],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(26, 24, 20, 0.04), 0 4px 12px rgba(26, 24, 20, 0.03)',
        'soft-md': '0 2px 8px rgba(26, 24, 20, 0.06), 0 8px 24px rgba(26, 24, 20, 0.04)',
        'soft-lg': '0 4px 16px rgba(26, 24, 20, 0.08), 0 16px 48px rgba(26, 24, 20, 0.05)',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee-reverse 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
