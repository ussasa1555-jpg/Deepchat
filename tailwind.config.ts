import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'retro-black': '#000000',
        'retro-green': '#00FF00',
        'retro-cyan': '#00FFFF',
        'retro-magenta': '#FF00FF',
        'retro-amber': '#FF9900',
        'retro-dark-green': '#003300',
        'retro-dark-cyan': '#001a1a',
        'retro-dark-magenta': '#330033',
        'retro-deep-black': '#0a0a0a',
        'retro-charcoal': '#333333',
        'retro-gray': '#666666',
        'retro-light-gray': '#999999',
      },
      fontFamily: {
        mono: ['Consolas', 'Courier New', 'Lucida Console', 'Monaco', 'monospace'],
        retro: ['VT323', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 0, 0.5)',
        'glow-green-lg': '0 0 20px rgba(0, 255, 0, 0.7)',
        'glow-cyan': '0 0 10px rgba(0, 255, 255, 0.5)',
        'glow-cyan-lg': '0 0 20px rgba(0, 255, 255, 0.7)',
        'glow-amber': '0 0 10px rgba(255, 153, 0, 0.5)',
        'glow-magenta': '0 0 10px rgba(255, 0, 255, 0.5)',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '10%, 30%, 50%, 70%, 90%': { opacity: '0.9' },
          '20%, 40%, 60%, 80%': { opacity: '1' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)', textShadow: 'none' },
          '20%': {
            transform: 'translate(-2px, 2px)',
            textShadow: '2px 0 #FF00FF, -2px 0 #00FFFF',
          },
          '40%': {
            transform: 'translate(2px, -2px)',
            textShadow: '-2px 0 #FF00FF, 2px 0 #00FFFF',
          },
          '60%': {
            transform: 'translate(-2px, -2px)',
            textShadow: '2px 0 #00FFFF, -2px 0 #FF00FF',
          },
          '80%': {
            transform: 'translate(2px, 2px)',
            textShadow: '-2px 0 #00FFFF, 2px 0 #FF00FF',
          },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor' },
        },
        'modal-appear': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'toast-slide-in': {
          from: { transform: 'translateY(-100px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        blink: 'blink 500ms infinite',
        flicker: 'flicker 300ms',
        glitch: 'glitch 300ms',
        'pulse-glow': 'pulse-glow 2s infinite',
        'modal-appear': 'modal-appear 200ms ease-out',
        'toast-slide-in': 'toast-slide-in 300ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;















