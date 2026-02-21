import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0910",
        surface: "#13111C",
        "surface-light": "#1B1828",
        "surface-border": "rgba(78,205,196,0.08)",
        teal: "#4ECDC4",
        "teal-light": "#7EDDD7",
        "teal-dim": "rgba(78,205,196,0.12)",
        gold: "#F0C674",
        "gold-light": "#F5D89A",
        "gold-dim": "rgba(240,198,116,0.12)",
        ember: "#FF6B6B",
        "ember-dim": "rgba(255,107,107,0.12)",
        "text-primary": "#EEEAF4",
        "text-secondary": "#9B95A8",
        "text-dim": "#8A8498",
        wood: "#7DD3A0",
        fire: "#F0736E",
        earth: "#E8C468",
        metal: "#B8C4D0",
        water: "#7BB8D4",
      },
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Noto Sans KR", "sans-serif"],
        display: ["Black Han Sans", "sans-serif"],
        hand: ["Gaegu", "cursive"],
      },
      maxWidth: {
        mobile: "430px",
      },
      animation: {
        "pillar-reveal": "pillarReveal 0.6s ease-out forwards",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "float": "gentleFloat 3s ease-in-out infinite",
        "fire-flicker": "fireFlicker 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
