/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Arvo', 'serif'],
        'sans': ['Rubik', 'sans-serif']
      },
      colors: {
        'gunmetal': '#253444',
        'powder': '#F3F4F6',
        'amethyst': {
          'hover': '#8154A0',
          'DEFAULT': '#8D62AC',
          'active': '#6B4686'
        },
        'slate': '#384157',
        'crimson': '#A31621'
      },
    },
  },
  plugins: [],
}

