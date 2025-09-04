/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
      colors: {
        primary: "#1E40AF", // Blue
        secondary: "#FBBF24", // Yellow
        accent: "#EF4444", // Red
        background: "#F3F4F6", // Gray
        text: "#111827", // Dark Gray
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
        mono: ["Fira Code", "monospace"],
      },
      
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
        toast: "0 2px 10px rgba(0, 0, 0, 0.1)",
      },

      spacing: {
        '128': '32rem', // 512px
        '144': '36rem', // 576px
        '160': '40rem', // 640px
      },
      screens: {
        '2xl': '1536px',
        '3xl': '1920px',
      },
    }

  },
  plugins: [],
};
