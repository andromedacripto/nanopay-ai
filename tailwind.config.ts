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
        // Paleta escura premium
        background: {
          DEFAULT: "#050810",
          secondary: "#0a0f1e",
          card: "#0d1424",
          elevated: "#111827",
        },
        brand: {
          blue: "#3b82f6",
          indigo: "#6366f1",
          cyan: "#06b6d4",
          "blue-light": "#60a5fa",
          "indigo-light": "#818cf8",
        },
        border: {
          DEFAULT: "#1e2d4a",
          subtle: "#162035",
          active: "#3b82f6",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#475569",
          accent: "#60a5fa",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#34d399",
          bg: "#052e16",
        },
        error: {
          DEFAULT: "#ef4444",
          light: "#f87171",
          bg: "#1c0000",
        },
        usdc: {
          DEFAULT: "#2775CA",
          light: "#5ba3f5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Cal Sans", "Inter", "sans-serif"],
      },
      backgroundImage: {
        // Gradientes azul premium
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":
          "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
        "gradient-brand-hover":
          "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.04) 100%)",
        "gradient-glow":
          "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)",
        "gradient-hero":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.3), transparent)",
      },
      boxShadow: {
        "brand-sm": "0 0 12px rgba(59,130,246,0.2)",
        brand: "0 0 24px rgba(59,130,246,0.25), 0 4px 16px rgba(0,0,0,0.4)",
        "brand-lg":
          "0 0 48px rgba(59,130,246,0.3), 0 8px 32px rgba(0,0,0,0.5)",
        card: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset",
        "card-hover":
          "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.2)",
        glow: "0 0 60px rgba(59,130,246,0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
