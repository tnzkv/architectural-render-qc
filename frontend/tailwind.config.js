/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          500: "#3b6fed",
          600: "#2f57c9",
          700: "#2646a3",
        },
      },
    },
  },
  plugins: [],
};
