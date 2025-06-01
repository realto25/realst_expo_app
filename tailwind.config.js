/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3498db",
        secondary: "#f1c40f",
        background: "#f9f9f9",
        text: "#333"
      },
      fontFamily: {
        'manrope': ['manrope'],
        'manrope-medium': ['manrope-medium'],
        'manrope-bold': ['manrope-bold']
      }
    }
  },
  plugins: []
}
