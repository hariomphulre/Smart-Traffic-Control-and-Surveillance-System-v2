/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Google Cloud Blue - Primary Action
        primary: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          200: '#aecbfa',
          300: '#8ab4f8',
          400: '#669df6',
          500: '#4285f4',  // Google Blue
          600: '#1a73e8',  // Main blue
          700: '#1967d2',
          800: '#185abc',
          900: '#174ea6',
        },
        // Success - Google Green
        success: {
          500: '#34a853',
          600: '#1e8e3e',
          700: '#137333',
        },
        // Warning - Google Yellow
        warning: {
          500: '#fbbc04',
          600: '#f9ab00',
        },
        // Danger - Google Red  
        danger: {
          500: '#ea4335',
          600: '#d93025',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
        mono: ['Roboto Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
