/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fade: "fadeInOut 3s ease-in-out forwards",
      },
      keyframes: {
        fadeInOut: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "10%": { opacity: 1, transform: "translateY(0)" },
          "90%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0, transform: "translateY(20px)" },
        },
      },
    }

  },
  plugins: [],
};
