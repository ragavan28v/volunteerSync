/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial"]
      }
    }
  },
  plugins: []
};
