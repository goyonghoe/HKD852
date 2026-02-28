import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F19",
        surface: "#111827",
        "surface-light": "#1F2937",
        "surface-border": "rgba(55, 65, 81, 0.5)",
        profit: "#10B981",
        "profit-dim": "rgba(16, 185, 129, 0.12)",
        loss: "#EF4444",
        "loss-dim": "rgba(239, 68, 68, 0.12)",
        accent: "#3B82F6",
        "accent-dim": "rgba(59, 130, 246, 0.12)",
        gold: "#F59E0B",
        "gold-dim": "rgba(245, 158, 11, 0.12)",
        "text-primary": "#F9FAFB",
        "text-secondary": "#9CA3AF",
        "text-dim": "#6B7280",
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
    },
  },
  plugins: [],
};
export default config;
