/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        card: "var(--color-card)",
        text: "var(--color-text)",
        "text-accent": "var(--color-text-accent)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        "button-secondary": "var(--color-button-secondary)",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
      },
      boxShadow: {
        "primary-glow": "0px 0px 10px rgba(0, 173, 181, 0.6)",
        "secondary-glow": "0px 0px 10px rgba(255, 107, 107, 0.6)",
        "success-glow": "0px 0px 10px rgba(34, 197, 94, 0.6)",
      },
    },
  },
  plugins: [],
};
