/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Obsidian & Champagne Gold Theme Tokens
        background: '#090A0F',
        surface: '#131620',
        card: '#131620',
        'border-subtle': '#242938',
        'accent-primary': '#E6C387',
        'accent-hover': '#D4AF37',
        'text-primary': '#F4F4F5',
        'text-muted': '#A1A1AA',
        'input-dark': '#0E111A',

        // Refined Champagne Gold Scale
        gold: {
          50: '#FBF8F2',
          100: '#F6EFE0',
          200: '#EEDDBF',
          300: '#E6C387', // Champagne Gold
          400: '#E6C387', // Refined Champagne Gold (accent-primary)
          500: '#D4AF37', // Accent Hover
          600: '#B8952B',
          700: '#94751E',
          800: '#6E5616',
          900: '#47360D',
        },
        // Regal Emerald (Pure Veg & Highlights)
        regal: {
          50: '#F2F7F4',
          100: '#E8F5EE',
          200: '#C6E3D3',
          500: '#2D6A4F',
          700: '#1B4332', // Deep Regal Emerald
          800: '#143326',
          900: '#0C2018',
        },
        // Burgundy Maroon (Non-Veg Highlights)
        burgundy: {
          50: '#FCF2F4',
          100: '#FDF0F2',
          200: '#F4D3D8',
          500: '#8B2635',
          700: '#6B1724', // Subtle Burgundy Maroon
          800: '#53101B',
          900: '#390A12',
        },
        // Luxury Neutral Warm Slate & Obsidian
        luxe: {
          bgLight: '#FAF8F5',    // Subtle Champagne Pearl
          cardLight: '#FFFFFF',  // Pure Milk White
          textLight: '#18181B',  // Deep Charcoal
          mutedLight: '#71717A', // Slate Neutral
          borderLight: '#E4E4E7',// Fine Border
          bgDark: '#090A0F',     // True Dark Obsidian
          cardDark: '#131620',   // Elevated Dark Surface
          textDark: '#F4F4F5',   // High-Contrast Pure White
          mutedDark: '#A1A1AA',  // Subtle Secondary Label
          borderDark: '#242938', // Fine Obsidian Border
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        heritage: ['Cinzel', 'Rozha One', 'Georgia', 'serif'],
        'serif-display': ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        'luxe-light': '0 4px 20px -2px rgba(44, 30, 20, 0.06), 0 2px 6px -1px rgba(44, 30, 20, 0.03)',
        'luxe-dark': '0 4px 25px -2px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
        'glow-gold': '0 0 25px -4px rgba(230, 195, 135, 0.35)',
        'lift': '0 10px 25px -3px rgba(44, 30, 20, 0.08), 0 4px 6px -2px rgba(44, 30, 20, 0.04)',
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer-gold': 'shimmerGold 2.2s linear infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmerGold: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
