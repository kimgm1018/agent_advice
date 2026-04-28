import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0B10",
        panel: "#10131D",
        line: "#2C3142",
        neon: "#7AF6FF",
        violet: "#A88BFF"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(122, 246, 255, 0.25), 0 0 40px rgba(122, 246, 255, 0.08)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 10% 10%, rgba(122,246,255,0.16), transparent 35%), radial-gradient(circle at 80% 5%, rgba(168,139,255,0.16), transparent 30%), linear-gradient(to bottom, #090B12 0%, #0D1019 100%)"
      }
    }
  },
  plugins: []
};

export default config;
