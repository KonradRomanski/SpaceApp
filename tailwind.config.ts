import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          900: "#00040C",
          800: "#001125",
          700: "#001F3F"
        },
        star: {
          500: "#FFD700",
          400: "#FFE57A"
        },
        flux: {
          500: "#00BFFF"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 30px rgba(0,191,255,0.25)",
        star: "0 0 24px rgba(255,215,0,0.35)"
      },
      backgroundImage: {
        "cosmic-radial": "radial-gradient(60% 60% at 50% 0%, rgba(0,191,255,0.25), rgba(0,0,0,0) 70%)",
        "nebula": "radial-gradient(40% 50% at 80% 20%, rgba(255,215,0,0.15), rgba(0,0,0,0) 60%), radial-gradient(50% 40% at 10% 10%, rgba(0,191,255,0.18), rgba(0,0,0,0) 60%)"
      }
    }
  },
  plugins: []
};

export default config;
