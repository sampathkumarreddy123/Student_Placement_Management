/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cocoa: {
          DEFAULT: '#44352D',
          dark: '#342822',
          light: '#534239',
        },
        warmBrown: {
          DEFAULT: '#76543D',
          hover: '#644632',
          light: '#8d654a',
        },
        bronze: {
          DEFAULT: '#A17C5B',
          light: '#b59272',
        },
        champagne: {
          DEFAULT: '#F1E7D9',
          light: '#F8F3EC',
          dark: '#E5D6C3',
        },
        ivory: {
          DEFAULT: '#FAF8F4',
          light: '#FDFCFB',
        },
        softBeige: {
          DEFAULT: '#F6F0E8',
          hover: '#EFE6DB',
        },
        borderCocoa: '#E8DED2',
        textCocoa: {
          main: '#44352D',
          muted: '#82776C',
        },
        statusSuccess: '#27845B',
        statusWarning: '#C58A32',
        statusDanger: '#C94C4C',
      },
    },
  },
  plugins: [],
}

