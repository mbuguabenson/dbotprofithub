/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx,scss,css}',
  ],
  theme: {
    fontFamily: {
      sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui'],
    },
    extend: {
      colors: {
        brand: {
          coral: 'var(--brand-red-coral)',
          secondary: 'var(--brand-secondary)',
          blue: 'var(--brand-blue)',
          teal: 'var(--brand-teal)',
          teal2: 'var(--brand-teal-2)',
        },
        general: {
          main1: 'var(--general-main-1)',
          main2: 'var(--general-main-2)',
        },
        text: {
          general: 'var(--text-general)',
          prominent: 'var(--text-prominent)',
          less: 'var(--text-less-prominent)',
        },
        section: {
          1: 'var(--general-section-1)',
          2: 'var(--general-section-2)',
          3: 'var(--general-section-3)',
        },
        status: {
          success: 'var(--status-success)',
          danger: 'var(--status-danger)',
          warning: 'var(--status-warning)',
          info: 'var(--status-info)',
        },
      },
      boxShadow: {
        panel: '0 4px 6px rgba(0,0,0,0.24), 0 8px 16px rgba(0,0,0,0.16)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-purple': 'var(--gradient-purple-primary)',
        'gradient-dark': 'var(--gradient-dark)',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        xl: '2.4rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        250: '250ms',
        300: '300ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};