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
          bg:              "var(--mkt-bg)",
          surface:         "var(--mkt-surface)",
          surface2:        "var(--mkt-surface2)",
          surface3:        "var(--mkt-surface3)",
          accent:          "var(--mkt-accent)",
          "accent-hover":  "var(--mkt-accent-hover)",
          "accent-lite":   "var(--mkt-accent-lite)",
          "accent-border": "var(--mkt-accent-border)",
          "accent-glow":   "var(--mkt-accent-glow)",
          text:            "var(--mkt-text)",
          muted:           "var(--mkt-muted)",
          muted2:          "var(--mkt-muted2)",
          green:           "var(--mkt-green)",
          "green-lite":    "var(--mkt-green-lite)",
          red:             "var(--mkt-red)",
          white:           "var(--mkt-white)",
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
