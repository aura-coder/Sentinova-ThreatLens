import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        secondary: "var(--secondary)",
        "muted-foreground": "var(--muted-foreground)",
        primary: "var(--primary)",
        destructive: "var(--destructive)",
      },
    },
  },
  plugins: [],
} satisfies Config;
