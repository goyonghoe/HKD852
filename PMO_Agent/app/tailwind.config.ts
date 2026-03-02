import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Monday.com-inspired dark navy palette
        bg: "#181B34",
        "bg-elevated": "#1C1F3B",
        surface: "#22254A",
        "surface-light": "#2C2F54",
        "surface-hover": "#33365E",
        "surface-border": "rgba(118, 118, 191, 0.15)",
        // Status colors (vivid, Monday-style)
        "st-green": "#00CA72",
        "st-blue": "#579BFC",
        "st-purple": "#A25DDC",
        "st-orange": "#FDAB3D",
        "st-red": "#E2445C",
        "st-gray": "#C4C4C4",
        "st-teal": "#66CCFF",
        // Accent
        accent: "#6C6CFF",
        "accent-hover": "#7B7BFF",
        "accent-dim": "rgba(108, 108, 255, 0.12)",
        // Priority
        "pri-critical": "#E2445C",
        "pri-high": "#FDAB3D",
        "pri-mid": "#579BFC",
        "pri-low": "#00CA72",
        // Text
        "text-primary": "#F5F6F8",
        "text-secondary": "#A9B0C5",
        "text-dim": "#6B7190",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.25), 0 0 1px rgba(0,0,0,0.15)",
        "card-hover":
          "0 8px 24px rgba(0,0,0,0.35), 0 0 1px rgba(0,0,0,0.15)",
        modal: "0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(118,118,191,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
