/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Nunito"', '"Quicksand"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', '"Nunito"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warm ink teal — main interactive elements
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
        // Warm amber/saffron — accent, highlights, celebrations
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Notebook paper surfaces
        paper: {
          DEFAULT: '#faf7f2',
          50: '#fdfcfa',
          100: '#faf7f2',
          200: '#f3ede3',
          300: '#e8dfd1',
          400: '#d4c9b8',
          500: '#b8a898',
        },
        // Ink colors — text and writing
        ink: {
          DEFAULT: '#3c3226',
          light: '#6b5e4f',
          muted: '#9c8e7c',
          faint: '#c4b8a8',
        },
        // Chapter bookmark tab colors
        ch: {
          fractions: '#dc2626',    // red bookmark
          patterns: '#7c3aed',     // violet bookmark
          prime: '#2563eb',        // blue bookmark
        },
      },
      boxShadow: {
        'notebook': '0 1px 3px rgba(60, 50, 38, 0.06), 0 0 0 1px rgba(60, 50, 38, 0.03)',
        'notebook-hover': '0 4px 12px rgba(60, 50, 38, 0.1), 0 0 0 1px rgba(60, 50, 38, 0.04)',
        'warm': '0 4px 20px -4px rgba(180, 83, 9, 0.12)',
      },
    },
  },
  plugins: [],
};
