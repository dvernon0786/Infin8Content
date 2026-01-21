import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: "var(--brand-electric-blue)",
        brandPurple: "var(--brand-infinite-purple)",
        charcoal: "var(--ui-charcoal)",
        lightGray: "var(--ui-light-gray)",
        primary: {
          DEFAULT: "var(--color-primary-blue)",
        },
      },
      backgroundImage: {
        brandGradient: "var(--brand-gradient)",
      },
      borderRadius: {
        md: "var(--radius-md)",
      },
    },
  },
  plugins: [],
};

export default config;
