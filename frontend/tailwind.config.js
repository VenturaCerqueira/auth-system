/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: 'var(--primary-bg)', // Body background
          surface: 'var(--primary-surface)', // Sidebar bg, cards
          main: 'var(--primary-main)', // Header bg, selected text
          text: 'var(--primary-text)', // Titles
          border: 'var(--primary-border)', // Sidebar border
          selected: 'var(--primary-selected)', // Selected item bg
          paragraph: 'var(--primary-paragraph)', // Paragraphs/legends
          secondary: 'var(--primary-secondary)', // For labels, similar to paragraph
          header: 'var(--primary-header)', // Header bg
          sidebar: 'var(--primary-sidebar)', // Sidebar bg
          gradientStart: 'var(--primary-gradientStart)', // Gradient start
          gradientVia: 'var(--primary-gradientVia)', // Gradient via
          gradientEnd: 'var(--primary-gradientEnd)', // Gradient end
        },
        dark: {
          bg: 'var(--dark-bg)', // Body background
          surface: 'var(--dark-surface)', // Cards
          main: 'var(--dark-main)', // Selected text
          text: 'var(--dark-text)', // Titles
          border: 'var(--dark-border)', // Sidebar bg
          header: 'var(--dark-header)', // Header bg
          paragraph: 'var(--dark-paragraph)', // Paragraphs/legends
          sidebar: 'var(--dark-sidebar)', // Sidebar bg
          selected: 'var(--dark-selected)', // Selected item bg
          secondary: 'var(--dark-secondary)', // For labels, similar to paragraph
          gradientStart: 'var(--dark-gradientStart)', // Gradient start
          gradientVia: 'var(--dark-gradientVia)', // Gradient via
          gradientEnd: 'var(--dark-gradientEnd)', // Gradient end
        },
      },
      backgroundImage: {
        'gradient-custom': 'linear-gradient(to right, var(--primary-gradientStart), var(--primary-gradientVia), var(--primary-gradientEnd))',
        'gradient-custom-dark': 'linear-gradient(to right, var(--dark-gradientStart), var(--dark-gradientVia), var(--dark-gradientEnd))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
