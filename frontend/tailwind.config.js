/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Aura Yellow-Blue brand colors
        zama: {
          primary: '#FDB022',      // Yellow/Gold
          secondary: '#0052FF',    // Electric Blue
          dark: '#1A1A2E',         // Dark background
          light: '#F7F9FC',        // Light background
          accent: '#00D9FF',       // Cyan accent
          gold: '#FFD700',         // Gold
        },
        // Auranode inspired colors (yellow-blue gradient)
        aura: {
          primary: '#FDB022',      // Yellow
          secondary: '#0052FF',    // Blue
          gradient: {
            from: '#FDB022',       // Yellow
            to: '#0052FF',         // Blue
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'aura-gradient': 'linear-gradient(135deg, #FDB022 0%, #0052FF 100%)',
        'zama-gradient': 'linear-gradient(135deg, #FDB022 0%, #00D9FF 100%)',
        'zama-hero': 'linear-gradient(135deg, #FDB022 0%, #0052FF 50%, #00D9FF 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #FDB022, 0 0 10px #FDB022' },
          '100%': { boxShadow: '0 0 10px #FDB022, 0 0 20px #0052FF, 0 0 30px #00D9FF' },
        },
      },
    },
  },
  plugins: [],
};
