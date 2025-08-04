// tailwind.config.js
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  darkMode: "class", // 啟用 dark mode
  theme: {
    extend: {
      colors: {
        // 主色調 - 黑底配色
        primary: {
          DEFAULT: "#60a5fa", // blue-400
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        secondary: {
          DEFAULT: "#67e8f9", // cyan-300
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        accent: {
          DEFAULT: "#fbbf24", // amber-400
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        dark: {
          DEFAULT: "#000000",
          50: "#171717",
          100: "#262626",
          200: "#404040",
          300: "#525252",
          400: "#737373",
          500: "#a3a3a3",
          600: "#d4d4d4",
          700: "#e5e5e5",
          800: "#f5f5f5",
          900: "#fafafa",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans TC", "system-ui", "sans-serif"],
        display: ["Inter", "Noto Sans TC", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "fade-in-down": "fadeInDown 0.6s ease-out",
        "slide-in-right": "slideInRight 0.6s ease-out",
        "slide-in-left": "slideInLeft 0.6s ease-out",
        "scale-in": "scaleIn 0.5s ease-out",
        "spin-slow": "spin 20s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        gradient: "gradient 15s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(96, 165, 250, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(96, 165, 250, 0.8)" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-mesh":
          'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grid)" /%3E%3C/svg%3E")',
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(96, 165, 250, 0.5)",
        glow: "0 0 20px rgba(96, 165, 250, 0.5)",
        "glow-lg": "0 0 30px rgba(96, 165, 250, 0.5)",
        "glow-xl": "0 0 40px rgba(96, 165, 250, 0.5)",
        "inner-glow": "inset 0 0 20px rgba(96, 165, 250, 0.5)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    // 自定義插件
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow-sm": {
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
        },
        ".text-shadow": {
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        },
        ".text-shadow-lg": {
          textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
        },
        ".text-shadow-glow": {
          textShadow: "0 0 20px rgba(96, 165, 250, 0.8)",
        },
      };
      addUtilities(newUtilities);
    },
    function ({ addBase, theme }) {
      addBase({
        'a:focus-visible, button:focus-visible, input:focus-visible, [tabindex]:not([tabindex="-1"]):focus-visible': {
          outline: `2px solid ${theme('colors.blue.400')}`,
          outlineOffset: '2px',
          borderRadius: '2px',
        },
      });
    },
  ],
};
