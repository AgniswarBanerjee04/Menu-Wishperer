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
        // Luxury Fine-Dining Antique Gold
        gold: {
          50: '#FAF7F2',
          100: '#F4EEE2',
          200: '#E8DBC5',
          300: '#D9C5A3',
          400: '#C5A880', // Muted Royal Antique Gold
          500: '#B89565',
          600: '#A37F4F',
          700: '#87653A',
          800: '#6E4F2B',
          900: '#4D361B',
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
        // Luxury Neutral Warm Slate & Espresso
        luxe: {
          bgLight: '#F7F4EE',    // Warm Ivory / Pearl Cream
          cardLight: '#FFFFFF',  // Pure Milk White
          textLight: '#1A1715',  // Deep Charcoal Espresso (7:1+ contrast)
          mutedLight: '#635A52', // Warm Slate Umber
          borderLight: '#E8E2D8',// Delicate Champagne Gold / Stone Taupe
          bgDark: '#121110',     // Deep Obsidian Charcoal
          cardDark: '#1B1917',   // Rich Dark Espresso
          textDark: '#F5F2EB',   // Soft Warm White
          mutedDark: '#A89F95',  // Warm Stone Taupe
          borderDark: '#3D352E', // Antique Gold Taupe
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
        'glow-gold': '0 0 25px -4px rgba(197, 168, 128, 0.35)',
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
