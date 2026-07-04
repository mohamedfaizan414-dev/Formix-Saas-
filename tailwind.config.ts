import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F6F7F5",
          dim: "#EEF0EC",
          dark: "#0E1416",
          darkdim: "#141B1E",
        },
        ink: {
          DEFAULT: "#132A33",
          soft: "#3D5A63",
          faint: "#7C919783",
        },
        clinical: {
          teal: "#1B3A45",
          tealdeep: "#0F262E",
          sage: "#4F7C6E",
          sagelight: "#DCEAE4",
          brick: "#B24C32",
          bricklight: "#F3DCD3",
          amber: "#C08A2E",
          amberlight: "#F4E6C8",
        },
        chart: {
          line: "#C9D2CE",
          linedark: "#233238",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "chart-grid":
          "linear-gradient(var(--chart-line) 1px, transparent 1px), linear-gradient(90deg, var(--chart-line) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(19,42,51,0.06), 0 8px 24px -12px rgba(19,42,51,0.18)",
        stamp: "0 2px 0 rgba(178,76,50,0.35)",
      },
      borderRadius: {
        xs: "3px",
      },
      keyframes: {
        stampIn: {
          "0%": { transform: "scale(1.4) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.95) rotate(-8deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        stampIn: "stampIn 0.4s cubic-bezier(.2,1.4,.4,1) forwards",
        slideUp: "slideUp 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
