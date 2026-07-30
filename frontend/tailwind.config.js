/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        card: {
          DEFAULT: 'var(--card)',
          hover: 'var(--card-hover)',
        },
        input: 'var(--input-bg)',
        dropdown: 'var(--dropdown-bg)',

        heading: 'var(--text-heading)',
        primaryText: 'var(--text-primary)',
        secondaryText: 'var(--text-secondary)',
        mutedText: 'var(--text-muted)',
        inverseText: 'var(--text-inverse)',

        border: 'var(--border)',
        borderHover: 'var(--border-hover)',

        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          text: 'var(--primary-text)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-hover)',
          text: 'var(--secondary-text)',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
          border: 'var(--success-border)',
          text: 'var(--success-text)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
          border: 'var(--warning-border)',
          text: 'var(--warning-text)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          bg: 'var(--danger-bg)',
          border: 'var(--danger-border)',
          text: 'var(--danger-text)',
        },
        tableHeader: 'var(--table-header-bg)',
        tableHover: 'var(--table-row-hover)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
