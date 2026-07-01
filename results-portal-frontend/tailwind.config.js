/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        portal: {
          navy: "#0b2c5c",
          blue: "#15499b",
          accent: "#1d63c9",
          bg: "#eef3fb",
          pass: "#1f7a3f",
          fail: "#b91c1c",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
