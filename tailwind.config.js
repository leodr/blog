module.exports = {
  content: ["./out/**/*.html"],
  theme: {
    fontFamily: {
      sans: ["Caslon"],
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
