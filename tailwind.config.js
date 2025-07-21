/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Natarix Brand Colors
      colors: {
        // Brand colors
        'brand-purple': '#8F65F8',
        'light-purple': '#EDE9FF',
        'accent-orange': '#FF865B',
        'soft-pink': '#FFD5EC',
        'sky-blue': '#D7E6FF',
        'highlight-yellow': '#FFF9B0',
        
        // Neutral colors
        'neutral-dark': '#2F2F2F',
        'neutral-light': '#F5F5F5',
        'border-gray': '#E0E0E0',
        
        // Interactive colors
        'link-color': '#5B5BFF',
        'accent-font': '#8B8B8B',
        
        // Vibe colors
        'vibe-cranky': '#FFB6B6',
        'vibe-chill': '#9ED5FF',
        'vibe-productive': '#FFDE99',
        
        // Notification
        'notification-red': '#FF4D4D',
        
        // Gradient stops
        'header-start': '#F3F3FF',
        'header-end': '#FFFFFF',
        'trending-start': '#B69CFF',
        'trending-end': '#E4D9FF',
        'community-start': '#FFA07A',
        'community-end': '#FFCB91',
      },
      
      // Custom gradients
      backgroundImage: {
        'header-gradient': 'linear-gradient(135deg, #F3F3FF 0%, #FFFFFF 100%)',
        'trending-gradient': 'linear-gradient(135deg, #B69CFF 0%, #E4D9FF 100%)',
        'community-gradient': 'linear-gradient(135deg, #FFA07A 0%, #FFCB91 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%)',
        'vibe-cranky': 'linear-gradient(135deg, #FFB6B6 0%, #FF9999 100%)',
        'vibe-chill': 'linear-gradient(135deg, #9ED5FF 0%, #7DC3FF 100%)',
        'vibe-productive': 'linear-gradient(135deg, #FFDE99 0%, #FFD17A 100%)',
      },
      
      // Glassmorphism backdrop blur
      backdropBlur: {
        'xs': '2px',
        'glass': '20px',
      },
      
      // Custom shadows for glassmorphism
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
        'glass-lg': '0 16px 64px 0 rgba(31, 38, 135, 0.15)',
        'glass-inner': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)',
        'notification': '0 4px 12px 0 rgba(255, 77, 77, 0.3)',
        'card-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.2)',
        'vibe-active': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
      },
      
      // Typography - Apple-style fonts
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
        'rounded': ['SF Pro Rounded', 'Inter', 'system-ui', 'sans-serif'],
      },
      
      // Border radius for different elements
      borderRadius: {
        'glass': '20px',
        'card': '16px',
        'button': '12px',
        'pill': '50px',
      },
      
      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      
      // Animation for glassmorphism effects
      animation: {
        'glass-shimmer': 'shimmer 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
        'bounce-soft': 'bounce 2s ease-in-out infinite',
      },
      
      keyframes: {
        shimmer: {
          '0%': { 'background-position': '200% 0' },
          '100%': { 'background-position': '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      // Z-index utilities
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for Natarix-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Glass card utility
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: theme('boxShadow.glass'),
        },
        
        // Glass navigation
        '.glass-nav': {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        
        // Vibe button states
        '.vibe-button': {
          transition: 'all 0.3s ease',
          border: '2px solid transparent',
        },
        
        '.vibe-button-active': {
          border: '2px solid rgba(255, 255, 255, 0.6)',
          boxShadow: theme('boxShadow.vibe-active'),
          transform: 'scale(1.05)',
        },
        
        // Notification badge
        '.notification-badge': {
          background: theme('colors.notification-red'),
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: '600',
          borderRadius: '50px',
          minWidth: '1.25rem',
          height: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme('boxShadow.notification'),
        },
        
        // Text gradient utilities
        '.text-gradient-purple': {
          background: 'linear-gradient(135deg, #8F65F8 0%, #B69CFF 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          color: 'transparent',
        },
        
        '.text-gradient-orange': {
          background: 'linear-gradient(135deg, #FF865B 0%, #FFA07A 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          color: 'transparent',
        },
        
        // Hover effects
        '.hover-lift': {
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme('boxShadow.card-hover'),
          },
        },
        
        // Interactive elements
        '.interactive': {
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.02)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
  
  // Safelist for dynamic classes
  safelist: [
    'bg-vibe-cranky',
    'bg-vibe-chill', 
    'bg-vibe-productive',
    'vibe-button-active',
    'notification-badge',
    'glass-card',
    'glass-nav',
    'text-gradient-purple',
    'text-gradient-orange',
    'hover-lift',
    'interactive',
  ]
};
