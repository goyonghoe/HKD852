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
        primary: "#7C5CFC",
        "primary-light": "#9B82FC",
        secondary: "#FF8FAB",
        "secondary-light": "#FFB3C6",
        cream: "#FFF8F0",
        "cream-dark": "#F5EDE3",
        wood: "#4CAF50",
        fire: "#FF5252",
        earth: "#FFB74D",
        metal: "#B0BEC5",
        water: "#42A5F5",
      },
      fontFamily: {
        pretendard: ["Pretendard", "system-ui", "sans-serif"],
      },
      maxWidth: {
        mobile: "430px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "pillar-reveal": "pillarReveal 0.5s ease-out forwards",
        "crystal-float": "crystalFloat 3s ease-in-out infinite",
        "badge-float": "badgeFloat 2.5s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7C5CFC, #FF8FAB)",
        "gradient-hero": "linear-gradient(180deg, #F5EDFF 0%, #FFF8F0 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
