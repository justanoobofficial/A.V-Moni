import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    borderRadius: {
      none: "0px",
      xs: "0px",
      sm: "0px",
      DEFAULT: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "0px",
    },
    extend: {
      fontFamily: {
        display: ["var(--font-marcellus)", "Marcellus", "Georgia", "serif"],
        sans: ["var(--font-josefin)", "Josefin Sans", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jetbrains)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      colors: {
        deco: {
          obsidian: "#0A0A0A",
          charcoal: "#141414",
          cream: "#F2F0E4",
          gold: "#D4AF37",
          goldLight: "#F2E8C4",
          midnight: "#1E3D59",
          pewter: "#888888",
        },
        // Map existing utility palettes to Art Deco Dark Luxury tokens
        // so every component automatically inherits the strict Gatsby palette
        slate: {
          50: "#F2F0E4",
          100: "#F2F0E4",
          200: "#E6E2D0",
          300: "#C8C2AA",
          400: "#888888",
          500: "#6E6A5E",
          600: "#4A4332",
          700: "#3D3319",
          800: "#2A2312",
          900: "#141414",
          950: "#0A0A0A",
        },
        emerald: {
          300: "#F2E8C4",
          400: "#D4AF37",
          500: "#D4AF37",
          600: "#B89327",
        },
        blue: {
          300: "#F2E8C4",
          400: "#D4AF37",
          500: "#1E3D59",
          600: "#1E3D59",
        },
        purple: {
          300: "#F2E8C4",
          400: "#D4AF37",
          500: "#1E3D59",
        },
        amber: {
          300: "#F2E8C4",
          400: "#D4AF37",
          500: "#D4AF37",
        },
      },
      boxShadow: {
        "deco-glow": "0 0 15px rgba(212, 175, 55, 0.2)",
        "deco-glow-lg": "0 0 24px rgba(212, 175, 55, 0.42)",
        "deco-underline": "0 4px 10px rgba(212, 175, 55, 0.25)",
      },
      keyframes: {
        flashGreen: {
          "0%": {
            backgroundColor: "rgba(212, 175, 55, 0.28)",
            boxShadow: "inset 0 0 20px rgba(212, 175, 55, 0.35)",
          },
          "100%": {
            backgroundColor: "transparent",
            boxShadow: "none",
          },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "flash-green": "flashGreen 2.2s ease-out forwards",
        "pulse-subtle": "pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
