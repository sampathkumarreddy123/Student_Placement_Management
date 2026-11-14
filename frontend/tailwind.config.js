/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#163A5F',
          dark: '#0F2843',
          light: '#1E4976',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',
        },
        appBg: '#EFF6FF',
        cardBg: '#FFFFFF',
        mainText: '#172554',
        secondaryText: '#64748B',
        appBorder: '#DBEAFE',
        appSuccess: '#0D9488',
        appWarning: '#D97706',
        appDanger: '#DC2626',
        lightAccent: '#DBEAFE',
        hoverBg: '#F0F7FF',
      },
    },
  },
  plugins: [],
}
