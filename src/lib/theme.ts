import { createTheme, ThemeOptions, Theme } from '@mui/material/styles'

// Extend MUI theme to include custom properties
declare module '@mui/material/styles' {
  interface TypeBackground {
    elevated?: string
  }
}

export type ThemeVariant = 'indigo' | 'green' | 'red' | 'blue' | 'purple' | 'amber'

export interface ThemeVariantConfig {
  name: string
  primary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
  secondary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
  darkBackground: {
    default: string
    paper: string
    elevated: string
  }
}

const commonTypography = {
  // Enhanced font families with Google Fonts
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'sans-serif',
  ].join(','),
  
  // Display font for headings
  fontFamilyDisplay: [
    'Nunito',
    'Inter', 
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'sans-serif',
  ].join(','),
  
  // Base font size
  fontSize: 16,
  
  // Enhanced typography scale
  h1: {
    fontFamily: 'Nunito, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },
  h2: {
    fontFamily: 'Nunito, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.025em',
  },
  h3: {
    fontFamily: 'Nunito, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.02em',
  },
  h4: {
    fontFamily: 'Nunito, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  h5: {
    fontFamily: 'Nunito, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontFamily: 'Nunito, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  
  // Body text
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    fontWeight: 400,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },
  
  // Small text
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 400,
  },
  overline: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  
  // Button text
  button: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
    textTransform: 'none' as const,
  },
}

const commonComponents = {
  MuiContainer: {
    styleOverrides: {
      root: {
        paddingLeft: '8px !important',
        paddingRight: '8px !important',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        position: 'relative' as const,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}40 0%, ${theme.palette.primary.dark}40 100%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-2px) scale(1.01)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)',
          '&::before': {
            opacity: 1,
          },
        },
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        borderRadius: '8px',
        textTransform: 'none' as const,
        fontWeight: 500,
        fontSize: '1rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        [theme.breakpoints.up('md')]: {
          fontSize: '1rem',
          fontWeight: 500,
        },
      }),
      contained: ({ theme }: { theme: Theme }) => ({
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: `0 2px 4px ${theme.palette.primary.main}30, 0 1px 2px ${theme.palette.primary.main}20`,
        borderRadius: '10px',
        position: 'relative' as const,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}20 0%, ${theme.palette.primary.main}20 100%)`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
        '&:hover': {
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          boxShadow: `0 6px 12px ${theme.palette.primary.main}35, 0 3px 6px ${theme.palette.primary.main}25`,
          transform: 'translateY(-2px) scale(1.02)',
          '&::before': {
            opacity: 1,
          },
        },
        '&:active': {
          transform: 'translateY(-1px) scale(1.01)',
        },
      }),
      outlined: ({ theme }: { theme: Theme }) => ({
        borderColor: theme.palette.primary.main,
        borderRadius: '10px',
        borderWidth: '2px',
        position: 'relative' as const,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.dark}08 100%)`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
        '&:hover': {
          borderColor: theme.palette.primary.dark,
          backgroundColor: `${theme.palette.primary.main}12`,
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: `0 4px 8px ${theme.palette.primary.main}20`,
          '&::before': {
            opacity: 1,
          },
        },
        '&:active': {
          transform: 'translateY(-1px) scale(1.01)',
        },
        // Enhanced error button styling - theme integrated with subtle danger indication
        '&.MuiButton-colorError': {
          borderColor: theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af',
          color: theme.palette.mode === 'dark' ? '#e5e7eb' : '#374151',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(248, 113, 113, 0.08)' : 'rgba(220, 38, 38, 0.03)',
          '&::before': {
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(220, 38, 38, 0.02) 0%, rgba(185, 28, 28, 0.02) 100%)',
          },
          '&:hover': {
            borderColor: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(248, 113, 113, 0.12)' : 'rgba(220, 38, 38, 0.05)',
            color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#1f2937',
            transform: 'translateY(-1px) scale(1.01)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        // Enhanced warning button styling - theme integrated with subtle warning indication
        '&.MuiButton-colorWarning': {
          borderColor: theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af',
          color: theme.palette.mode === 'dark' ? '#e5e7eb' : '#374151',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(217, 119, 6, 0.03)',
          '&::before': {
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(217, 119, 6, 0.02) 0%, rgba(180, 83, 9, 0.02) 100%)',
          },
          '&:hover': {
            borderColor: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(217, 119, 6, 0.05)',
            color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#1f2937',
            transform: 'translateY(-1px) scale(1.01)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        // Enhanced info button styling - theme integrated
        '&.MuiButton-colorInfo': {
          borderColor: theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af',
          color: theme.palette.mode === 'dark' ? '#e5e7eb' : '#374151',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.03)',
          '&::before': {
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(37, 99, 235, 0.02) 0%, rgba(30, 64, 175, 0.02) 100%)',
          },
          '&:hover': {
            borderColor: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(96, 165, 250, 0.12)' : 'rgba(37, 99, 235, 0.05)',
            color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#1f2937',
            transform: 'translateY(-1px) scale(1.01)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      }),
      text: ({ theme }: { theme: Theme }) => ({
        borderRadius: '8px',
        position: 'relative' as const,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}12`,
          transform: 'translateY(-1px) scale(1.02)',
          '&::before': {
            opacity: 1,
          },
        },
        '&:active': {
          transform: 'translateY(0) scale(1.01)',
        },
      }),
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.light}08 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '&:hover': {
            '&::before': {
              opacity: 1,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
            },
          },
          '&.Mui-focused': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            transform: 'scale(1.01)',
            '&::before': {
              opacity: 1,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
              boxShadow: `0 0 0 4px ${theme.palette.primary.main}20, 0 2px 8px ${theme.palette.primary.main}15`,
            },
          },
        },
        '& .MuiInputLabel-root': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-focused': {
            color: theme.palette.primary.main,
            fontWeight: 500,
          },
        },
      }),
    },
  },
  // Enhanced Skeleton styling
  MuiSkeleton: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        borderRadius: '8px',
        background: `linear-gradient(90deg, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 25%, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} 50%, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s infinite ease-in-out',
        '@keyframes shimmer': {
          '0%': {
            backgroundPosition: '200% 0',
          },
          '100%': {
            backgroundPosition: '-200% 0',
          },
        },
      }),
    },
  },
  // Enhanced Dialog/Modal styling
  MuiDialog: {
    styleOverrides: {
      root: {
        '& .MuiBackdrop-root': {
          animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(4px)',
        },
        '@keyframes fadeIn': {
          '0%': {
            opacity: 0,
          },
          '100%': {
            opacity: 1,
          },
        },
      },
      paper: ({ theme }: { theme: Theme }) => ({
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        animation: 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes slideInUp': {
          '0%': {
            opacity: 0,
            transform: 'translateY(30px) scale(0.95)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          },
        },
      }),
    },
  },
  // Enhanced Drawer styling
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }: { theme: Theme }) => ({
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes slideIn': {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(0)',
          },
        },
      }),
    },
  },
  // Enhanced Chip styling with micro-interactions
  MuiChip: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'scale(1.05) translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
        '&:active': {
          transform: 'scale(1.02) translateY(0)',
        },
      }),
    },
  },
  // Enhanced MenuItem styling
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        borderRadius: '6px',
        margin: '2px 8px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative' as const,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.light}10 100%)`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
        '&:hover': {
          transform: 'translateX(4px)',
          '&::before': {
            opacity: 1,
          },
        },
      }),
    },
  },
  // Enhanced Switch styling
  MuiSwitch: {
    styleOverrides: {
      switchBase: ({ theme }: { theme: Theme }) => ({
        '&.Mui-checked': {
          '& + .MuiSwitch-track': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
          },
        },
      }),
      thumb: {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
}

// Enhanced color system with gradients and semantic colors
const enhancedColors = {
  // Primary gradient system
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff', 
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    gradientHover: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)'
  },
  
  // Warm secondary system
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a', 
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Theme-integrated category colors for books - harmonized with design system
  categories: {
    // Core fiction genres - using primary palette variations
    fiction: '#8b5cf6',         // Purple (primary variant)
    fantasy: '#a855f7',         // Bright Purple (primary light)
    sciencefiction: '#6366f1',  // Indigo (theme secondary)
    mystery: '#4f46e5',         // Deep Indigo (secondary dark)
    thriller: '#3730a3',        // Very Deep Indigo
    horror: '#7f1d1d',          // Dark Red (muted)
    romance: '#be185d',         // Pink (muted)
    drama: '#c2410c',           // Orange (muted)
    adventure: '#047857',       // Emerald Green (muted)
    
    // Non-fiction categories - muted earth tones
    nonfiction: '#047857',      // Forest Green (muted)
    biography: '#c2410c',       // Orange (muted)
    autobiography: '#b45309',   // Dark Amber (muted)
    memoir: '#c2410c',          // Orange (muted)
    history: '#b91c1c',         // Red (muted)
    politics: '#991b1b',        // Dark Red (muted)
    philosophy: '#6d28d9',      // Purple (keeping for distinction)
    religion: '#5b21b6',        // Deep Purple (muted)
    spirituality: '#7c3aed',    // Light Purple (muted)
    
    // Educational and reference
    science: '#3b82f6',         // Blue
    technology: '#06b6d4',      // Cyan
    medicine: '#10b981',        // Green
    health: '#22c55e',          // Light Green
    fitness: '#16a34a',         // Forest Green
    psychology: '#a855f7',      // Bright Purple
    education: '#f59e0b',       // Amber
    reference: '#6b7280',       // Gray (keep for actual reference books)
    textbook: '#64748b',        // Blue Gray
    
    // Lifestyle and practical
    cooking: '#f97316',         // Orange
    food: '#ea580c',            // Deep Orange
    travel: '#06b6d4',          // Cyan
    sports: '#22c55e',          // Green
    business: '#059669',        // Dark Green
    economics: '#047857',       // Forest Green
    selfhelp: '#ec4899',        // Pink
    parenting: '#f472b6',       // Light Pink
    relationships: '#fb7185',   // Rose
    
    // Arts and creativity
    art: '#f43f5e',             // Rose
    photography: '#e11d48',     // Dark Rose
    music: '#be185d',           // Deep Pink
    poetry: '#a21caf',          // Purple Pink
    literature: '#7c2d12',      // Brown
    writing: '#92400e',         // Dark Orange
    crafts: '#dc2626',          // Red
    design: '#b91c1c',          // Dark Red
    
    // Special categories
    children: '#22c55e',        // Green
    youngadult: '#06b6d4',      // Cyan
    comic: '#f59e0b',           // Amber
    graphic: '#d97706',         // Dark Amber
    manga: '#dc2626',           // Red
    humor: '#fbbf24',           // Yellow
    satire: '#f59e0b',          // Amber
    
    // Additional common genres
    true: '#10b981',            // Emerald (true crime, true story)
    crime: '#dc2626',           // Red
    legal: '#374151',           // Dark Gray
    war: '#7f1d1d',            // Dark Red
    military: '#6b7280',        // Gray
    nature: '#16a34a',          // Forest Green
    environment: '#059669',     // Dark Green
    gardening: '#22c55e',       // Green
    home: '#f97316',           // Orange
    diy: '#ea580c',            // Deep Orange
  },
  
  // Enhanced neutrals with warmth
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb', 
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}

// Define theme variant configurations
export const themeVariants: Record<ThemeVariant, ThemeVariantConfig> = {
  indigo: {
    name: 'Indigo',
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff', 
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    secondary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a', 
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    darkBackground: {
      default: '#0f172a', // Rich dark slate
      paper: '#1e293b',   // Elevated dark surfaces
      elevated: '#334155', // Higher elevated surfaces
    },
  },
  green: {
    name: 'Forest Green',
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    secondary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    darkBackground: {
      default: '#0c1710', // Deep forest green-black
      paper: '#1a2e20',   // Dark forest green
      elevated: '#233529', // Elevated forest surfaces
    },
  },
  red: {
    name: 'Crimson Red',
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    secondary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    darkBackground: {
      default: '#180a0a', // Deep crimson-black
      paper: '#2d1515',   // Dark crimson
      elevated: '#3d1a1a', // Elevated crimson surfaces
    },
  },
  blue: {
    name: 'Ocean Blue',
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    darkBackground: {
      default: '#0a1220', // Deep ocean blue-black
      paper: '#1a2332',   // Dark ocean blue
      elevated: '#253244', // Elevated ocean surfaces
    },
  },
  purple: {
    name: 'Royal Purple',
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    secondary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    darkBackground: {
      default: '#140a18', // Deep royal purple-black
      paper: '#251a2d',   // Dark royal purple
      elevated: '#352038', // Elevated royal surfaces
    },
  },
  amber: {
    name: 'Golden Amber',
    primary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    secondary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    darkBackground: {
      default: '#1a1308', // Deep golden amber-black
      paper: '#2d2415',   // Dark golden amber
      elevated: '#3d3020', // Elevated golden surfaces
    },
  },
}

function createThemeOptions(isDark: boolean, variant: ThemeVariant): ThemeOptions {
  const variantConfig = themeVariants[variant]
  
  const lightThemeOptions: ThemeOptions = {
    palette: {
      mode: 'light',
      primary: {
        main: variantConfig.primary[600],
        light: variantConfig.primary[400],
        dark: variantConfig.primary[800],
        contrastText: '#ffffff',
      },
      secondary: {
        main: variantConfig.secondary[500],
        light: variantConfig.secondary[300],
        dark: variantConfig.secondary[700],
        contrastText: '#ffffff',
      },
    error: {
      main: '#ef4444',        // Modern red
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',        // Warm amber
      light: '#fbbf24', 
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3b82f6',        // Modern blue
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',        // Modern emerald
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafbfc',     // Warmer white
      paper: '#ffffff',
      elevated: '#f8fafc',    // Subtle elevated surfaces
    } as any,
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: commonTypography,
  components: {
    ...commonComponents,
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: '12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-1px)',
          },
        }),
      },
    },
    // Enhanced Tab styling
    MuiTab: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          textTransform: 'none' as const,
          fontWeight: 500,
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          margin: '0 4px',
          minHeight: '48px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          // Default inactive state - subtle outline to show tabs exist
          backgroundColor: 'transparent',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderBottom: 'none',
          color: theme.palette.text.secondary,
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          
          '&.Mui-selected': {
            // Active tab matches content background exactly  
            backgroundColor: theme.palette.mode === 'dark'
              ? theme.palette.background.paper 
              : theme.palette.background.paper,
            color: theme.palette.primary.main,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderBottom: 'none',
            position: 'relative',
            zIndex: 1,
            transform: 'translateY(-1px)',
            '&::before': {
              opacity: 1,
            },
          },
          '&:hover:not(.Mui-selected)': {
            // Hover state - lighter than active but darker than inactive
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.02)',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            transform: 'translateY(-0.5px)',
            '&::before': {
              opacity: 0.3,
            },
          },
        }),
      },
    },
    // Enhanced Rating component
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: '#f59e0b',
          filter: 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3))',
        },
        iconEmpty: {
          color: '#d1d5db',
        },
        iconHover: {
          color: '#fbbf24',
          transform: 'scale(1.05)',
        },
      },
    },
  },
}

  const darkThemeOptions: ThemeOptions = {
    palette: {
      mode: 'dark',
      primary: {
        main: variantConfig.primary[300],
        light: variantConfig.primary[200],
        dark: variantConfig.primary[400],
        contrastText: '#000000',
      },
      secondary: {
        main: variantConfig.secondary[400],
        light: variantConfig.secondary[300],
        dark: variantConfig.secondary[500],
        contrastText: '#ffffff',
      },
    error: {
      main: '#f87171',        // Lighter red for dark mode
      light: '#fca5a5',
      dark: '#ef4444',
      contrastText: '#000000',
    },
    warning: {
      main: '#fbbf24',        // Lighter amber for dark mode
      light: '#fde047',
      dark: '#f59e0b',
      contrastText: '#000000',
    },
    info: {
      main: '#60a5fa',        // Lighter blue for dark mode
      light: '#93c5fd',
      dark: '#3b82f6',
      contrastText: '#000000',
    },
    success: {
      main: '#34d399',        // Lighter emerald for dark mode
      light: '#6ee7b7',
      dark: '#10b981',
      contrastText: '#000000',
    },
    background: {
      default: variantConfig.darkBackground.default,
      paper: variantConfig.darkBackground.paper,
      elevated: variantConfig.darkBackground.elevated,
    } as any,
    text: {
      primary: 'rgba(255, 255, 255, 0.95)', // Increased contrast
      secondary: 'rgba(255, 255, 255, 0.75)', // Increased contrast for better readability
    },
  },
  typography: commonTypography,
  components: {
    ...commonComponents,
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: '12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: variantConfig.darkBackground.elevated,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
          border: `1px solid ${variantConfig.darkBackground.elevated}`,
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.25)',
            transform: 'translateY(-1px)',
          },
        }),
      },
    },
    // Enhanced Tab styling for dark mode
    MuiTab: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          textTransform: 'none' as const,
          fontWeight: 500,
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          margin: '0 4px',
          minHeight: '48px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          // Default inactive state - completely transparent
          backgroundColor: 'transparent',
          border: 'none',
          borderBottom: 'none',
          color: theme.palette.text.secondary,
          
          '&.Mui-selected': {
            // Active tabs get elevated background and stronger border
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid rgba(255,255,255,0.2)`,
            borderBottom: 'none',
            position: 'relative',
            zIndex: 1,
          },
          '&:hover:not(.Mui-selected)': {
            // Hover state - lighter than active but darker than inactive
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.2)',
          },
        }),
      },
    },
    // Enhanced Rating component for dark mode
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: '#fbbf24',
          filter: 'drop-shadow(0 1px 2px rgba(251, 191, 36, 0.4))',
        },
        iconEmpty: {
          color: '#6b7280',
        },
        iconHover: {
          color: '#fde047',
          transform: 'scale(1.05)',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#bb86fc', // Light purple for better contrast in dark mode
          '&:hover': {
            color: '#d1c4e9', // Lighter on hover
          },
        },
      },
    },
    // Enhanced Button styling inherits from commonComponents
    MuiButton: {
      styleOverrides: {
        ...commonComponents.MuiButton.styleOverrides,
        text: ({ theme }: { theme: Theme }) => ({
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: `${theme.palette.primary.main}20`,
            transform: 'translateY(-1px)',
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: 'rgba(255, 255, 255, 0.85)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: variantConfig.darkBackground.paper,
          color: 'rgba(255, 255, 255, 0.95)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.95)', // Ensure title text is white
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.95)', // Ensure content text is white
        },
      },
    },
  },
}

  return isDark ? darkThemeOptions : lightThemeOptions
}

export const lightTheme = createTheme(createThemeOptions(false, 'green'))
export const darkTheme = createTheme(createThemeOptions(true, 'green'))

// Export default theme for backwards compatibility
export const theme = lightTheme

export function createAppTheme(isDark: boolean, variant: ThemeVariant = 'green') {
  return createTheme(createThemeOptions(isDark, variant))
}

// Export enhanced colors for use in components
export { enhancedColors }

// Genre synonym mappings for better matching
const genreSynonyms: Record<string, string> = {
  // Science Fiction variations
  'scifi': 'sciencefiction',
  'sci-fi': 'sciencefiction',  
  'sciencefiction': 'sciencefiction',
  'sf': 'sciencefiction',
  
  // Self-help variations
  'self-help': 'selfhelp',
  'selfhelp': 'selfhelp',
  'personal development': 'selfhelp',
  'personaldevelopment': 'selfhelp',
  'self improvement': 'selfhelp',
  'selfimprovement': 'selfhelp',
  
  // Young adult variations
  'young adult': 'youngadult',
  'ya': 'youngadult',
  'teen': 'youngadult',
  'teenager': 'youngadult',
  
  // True crime/story variations
  'true crime': 'true',
  'truecrime': 'true',
  'true story': 'true',
  'truestory': 'true',
  
  // Art variations
  'art & design': 'art',
  'arts': 'art',
  'fine art': 'art',
  'fineart': 'art',
  
  // Health variations
  'health & fitness': 'health',
  'healthfitness': 'health',
  'wellness': 'health',
  'medical': 'medicine',
  
  // Biography variations
  'bio': 'biography',
  'biographies': 'biography',
  
  // Children's variations
  'childrens': 'children',
  'kids': 'children',
  'juvenile': 'children',
  
  // Literature variations
  'classic': 'literature',
  'classics': 'literature',
  'literary fiction': 'literature',
  'literaryfiction': 'literature',
  
  // Business variations
  'business & economics': 'business',
  'businesseconomics': 'business',
  'entrepreneurship': 'business',
  'management': 'business',
  
  // DIY variations
  'do it yourself': 'diy',
  'howto': 'diy',
  'how-to': 'diy',
  
  // Home variations
  'home & garden': 'home',
  'homegarden': 'home',
  'house': 'home',
  'interior design': 'design',
  'interiordesign': 'design',
}

// Utility function to get category color with enhanced matching and fallback
export function getCategoryColor(category: string): string {
  // Normalize the category
  const normalizedCategory = category.toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-letters except spaces
    .replace(/\s+/g, '') // Remove spaces
  
  // Check for direct match first
  let colorKey = normalizedCategory as keyof typeof enhancedColors.categories
  if (enhancedColors.categories[colorKey]) {
    return enhancedColors.categories[colorKey]
  }
  
  // Check synonyms
  if (genreSynonyms[normalizedCategory]) {
    colorKey = genreSynonyms[normalizedCategory] as keyof typeof enhancedColors.categories
    if (enhancedColors.categories[colorKey]) {
      return enhancedColors.categories[colorKey]
    }
  }
  
  // Smart fallback: generate consistent color based on genre name hash
  return generateSmartFallbackColor(normalizedCategory)
}

// Generate consistent, accessible colors for unmapped genres
function generateSmartFallbackColor(genre: string): string {
  // Accessible color palette for fallback - ensuring good contrast
  const fallbackColors = [
    '#8b5cf6', // Purple
    '#10b981', // Emerald  
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#22c55e', // Green
    '#f97316', // Orange
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#a855f7', // Bright Purple
    '#059669', // Dark Green
    '#d97706', // Dark Amber
    '#dc2626', // Dark Red
    '#0891b2', // Dark Cyan
    '#16a34a', // Forest Green
    '#ea580c', // Deep Orange
    '#e11d48', // Dark Rose
    '#7c3aed', // Deep Purple
    '#047857', // Very Dark Green
  ]
  
  // Create a simple hash of the genre name
  let hash = 0
  for (let i = 0; i < genre.length; i++) {
    const char = genre.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use hash to select consistent color
  const colorIndex = Math.abs(hash) % fallbackColors.length
  return fallbackColors[colorIndex]
}

// Utility function to get gradient styles
export function getPrimaryGradient(isDark = false): string {
  return isDark 
    ? 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)'
    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
}

export function getPrimaryGradientHover(isDark = false): string {
  return isDark
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    : 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)'
}