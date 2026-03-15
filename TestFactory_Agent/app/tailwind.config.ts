import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        mobile: "430px",
      },
      colors: {
        bg: "#FFFFFF",
        "bg-soft": "#F8F9FA",
        surface: "#FFFFFF",
        "surface-alt": "#F3F4F6",
        "surface-border": "#E5E7EB",
        primary: "#6C5CE7",
        "primary-light": "#A29BFE",
        "primary-bg": "#F0EEFF",
        secondary: "#FF6B6B",
        "secondary-light": "#FF9B9B",
        kakao: "#FEE500",
        "kakao-text": "#3C1E1E",
        "text-primary": "#1A1A2E",
        "text-secondary": "#4A4A6A",
        "text-dim": "#9B9BB0",
        success: "#00B894",
        warning: "#FDCB6E",
        danger: "#FF7675",
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.375rem" }],
        base: ["1.0625rem", { lineHeight: "1.625rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
        xl: ["1.3125rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5625rem", { lineHeight: "2.125rem" }],
        "3xl": ["2rem", { lineHeight: "2.5rem" }],
        "4xl": ["2.5rem", { lineHeight: "3rem" }],
      },
      fontFamily: {
        sans: ["Pretendard Variable", "sans-serif"],
        display: ["Black Han Sans", "sans-serif"],
        fun: ["Jua", "sans-serif"],
      },
      keyframes: {
        questionSlideIn: {
          from: { transform: "translateX(60px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        optionPulse: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
        resultReveal: {
          "0%": { transform: "scale(0.3) rotate(-10deg)", opacity: "0" },
          "50%": { transform: "scale(1.1) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        fadeUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        progressFill: {
          from: { width: "var(--from-width, 0%)" },
          to: { width: "var(--to-width, 100%)" },
        },
        confettiBurst: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateY(-200px) rotate(720deg)",
            opacity: "0",
          },
        },
      },
      animation: {
        "question-in": "questionSlideIn 0.4s ease-out",
        "option-pulse": "optionPulse 0.2s ease-out",
        "result-reveal": "resultReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-up": "fadeUp 0.5s ease-out",
        confetti: "confettiBurst 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
