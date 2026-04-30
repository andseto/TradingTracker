import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gain: "#22c55e",
        loss: "#ef4444",
        "gain-dim": "#16a34a",
        "loss-dim": "#dc2626",
        bg: {
          primary: "#0d0d0f",
          secondary: "#131316",
          card: "#1a1a1f",
          hover: "#1f1f26",
          border: "#2a2a35",
        },
        text: {
          primary: "#e8e8f0",
          secondary: "#9090a8",
          muted: "#55556a",
        },
        accent: {
          DEFAULT: "#6366f1",
          dim: "#4f46e5",
          muted: "#312e81",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
