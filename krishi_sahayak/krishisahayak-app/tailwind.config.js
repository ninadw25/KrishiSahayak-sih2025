/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'dm-regular': ['DM-Regular'],
        'dm-medium': ['DM-Medium'],
        'dm-bold': ['DM-Bold'],
        // Set DM Regular as default
        'sans': ['DM-Regular'],
      },
    },
  },
  plugins: [],
}