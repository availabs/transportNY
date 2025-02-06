const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  darkMode: 'class', //'media',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': [
          'Rubik',
          ...defaultTheme.fontFamily.sans],

        'display': [
          'Rubik',
          ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}