/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        raze: {
          void: '#030407',
          deep: '#06080F',
          surface: '#0B0F19',
          card: 'rgba(11, 15, 25, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          borderLight: 'rgba(255, 255, 255, 0.15)',
          ice: '#E0F2FE',
          cyan: '#00E5FF',
          blue: '#38BDF8',
          blueGlow: '#60A5FA',
          orange: '#FF5722',
          orangeGlow: '#FF7043',
          silver: '#E2E8F0',
          silverMuted: '#94A3B8'
        },
        og: {
          bg: '#030407',
          surface: '#0B0F19',
          panel: '#101524',
          border: 'rgba(255, 255, 255, 0.08)',
          borderStrong: 'rgba(255, 255, 255, 0.18)',
          primary: '#38BDF8',
          violet: '#818CF8',
          cyan: '#00E5FF',
          text: '#F8FAFC',
          muted: '#94A3B8',
          danger: '#FF4D6D',
          warning: '#F59E0B',
          success: '#10B981'
        }
      },
      fontFamily: {
        raze: ['Orbitron', 'Space Grotesk', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(0, 229, 255, 0.4)',
        'glow-orange': '0 0 25px -5px rgba(255, 87, 34, 0.4)',
        'glow-ice': '0 0 35px 2px rgba(224, 242, 254, 0.3)',
        'glow-danger': '0 0 25px -5px rgba(255, 77, 109, 0.4)'
      }
    },
  },
  plugins: [],
}
