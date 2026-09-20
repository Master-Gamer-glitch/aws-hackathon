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
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        crew: {
          bg: "#0B0E14",
          surface: "#111622",
          elevated: "#182032",
          border: "#1E293B",
          borderLight: "#334155",
          blue: "#38BDF8",
          purple: "#A78BFA",
          amber: "#F59E0B",
          emerald: "#10B981",
          wood: "#92400E",
          woodLight: "#D97706",
        },
        'crew-bg': 'var(--bg-page, #0B0E14)',
        'crew-surface': 'var(--bg-surface, #12161D)',
        'crew-surface-secondary': 'var(--bg-surface-secondary, #171C24)',
        'crew-card': 'var(--bg-card, #1B212A)',
        'crew-elevated': 'var(--bg-elevated, #202731)',
        'crew-hover': 'var(--bg-hover, #202731)',
        'crew-border': 'var(--border-subtle, #2B333E)',
        'crew-border-strong': 'var(--border-strong, #394350)',
        'crew-text': 'var(--text-primary, #F2F0EB)',
        'crew-text-secondary': 'var(--text-secondary, #A6AEB8)',
        'crew-text-muted': 'var(--text-muted, #737D89)',
        'crew-primary': 'var(--primary, #D64B55)',
        'crew-primary-hover': 'var(--primary-hover, #E25B64)',
        'crew-primary-soft': 'var(--primary-soft, #321A1E)',
        'crew-purple': 'var(--purple, #927BAA)',
        'crew-purple-soft': 'var(--purple-soft, #28212F)',
        'crew-success': 'var(--success, #4BA982)',
        'crew-success-soft': 'var(--success-soft, #162B22)',
        'crew-warning': 'var(--warning, #C99A45)',
        'crew-warning-soft': 'var(--warning-soft, #2E2516)',
        'crew-error': 'var(--error, #D9585F)',
        'crew-error-soft': 'var(--error-soft, #321A1E)',
        'crew-info': 'var(--info, #6B99A8)',
        'crew-info-soft': 'var(--info-soft, #1A262C)',
      },
      borderRadius: {
        control: '0.375rem',
        card: '0.5rem',
        panel: '0.625rem',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      letterSpacing: {
        ultra: "0.25em",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bloom-pulse": "bloom 2.5s ease-out infinite",
        "scanline": "scanline 8s linear infinite",
        "shimmer": "shimmer 2s infinite linear",
      },
      keyframes: {
        bloom: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        panel: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        "neon-blue": "0 0 25px -5px rgba(56, 189, 248, 0.4)",
        "neon-purple": "0 0 25px -5px rgba(167, 139, 250, 0.4)",
        "neon-amber": "0 0 25px -5px rgba(245, 158, 11, 0.4)",
        "bloom": "0 0 80px 20px rgba(56, 189, 248, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
