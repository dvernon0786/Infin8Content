import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-sora)", "Sora", "system-ui", "sans-serif"],
        body:    ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        lato:    ["var(--font-lato)", "Lato", "sans-serif"],
      },
      colors: {
        brandBlue: "var(--brand-electric-blue)",
        brandPurple: "var(--brand-infinite-purple)",
        charcoal: "var(--ui-charcoal)",
        lightGray: "var(--ui-light-gray)",
        primary: {
          DEFAULT: "var(--color-primary-blue)",
        },
        mkt: {
          bg:              "#08090d",
          surface:         "#0f1117",
          surface2:        "#13151e",
          surface3:        "#0b0d14",
          accent:          "#4f6ef7",
          "accent-hover":  "#3d5df5",
          "accent-lite":   "rgba(79,110,247,0.12)",
          "accent-border": "rgba(79,110,247,0.25)",
          "accent-glow":   "rgba(79,110,247,0.18)",
          text:            "#e8eaf2",
          muted:           "#7b8098",
          muted2:          "#4a4f68",
          green:           "#22c55e",
          "green-lite":    "rgba(34,197,94,0.1)",
          red:             "#ef4444",
          white:           "#ffffff",
        },
      },
      backgroundImage: {
        brandGradient: "var(--brand-gradient)",
      },
      borderRadius: {
        md:  "var(--radius-md)",
        "4xl": "28px",
        "5xl": "36px",
      },
      boxShadow: {
        "mkt-glow":    "0 0 20px rgba(79,110,247,0.3)",
        "mkt-glow-lg": "0 0 30px rgba(79,110,247,0.5)",
        "mkt-card":    "0 20px 60px rgba(0,0,0,0.4)",
        "mkt-hero":    "0 40px 100px rgba(0,0,0,0.6)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1.75rem",
          sm:  "1.75rem",
          lg:  "1.75rem",
          xl:  "1.75rem",
        },
        screens: {
          sm:    "640px",
          md:    "768px",
          lg:    "1024px",
          xl:    "1160px",
          "2xl": "1160px",
        },
      },
      letterSpacing: {
        tight2: "-1.5px",
        tight1: "-0.6px",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-up":    "fadeUp 0.6s ease forwards",
        "pulse-glow": "pulseGlow 2s infinite",
        shimmer:      "shimmer 1.4s infinite linear",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1.4" }],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
