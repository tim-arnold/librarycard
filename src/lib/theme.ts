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
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        borderRadius: '12px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-1px)',
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
        boxShadow: `0 1px 3px ${theme.palette.primary.main}40, 0 1px 2px ${theme.palette.primary.main}20`,
        '&:hover': {
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          boxShadow: `0 4px 6px ${theme.palette.primary.main}40, 0 2px 4px ${theme.palette.primary.main}25`,
          transform: 'translateY(-1px)',
        },
      }),
      outlined: ({ theme }: { theme: Theme }) => ({
        borderColor: theme.palette.primary.main,
        '&:hover': {
          borderColor: theme.palette.primary.dark,
          backgroundColor: `${theme.palette.primary.main}10`,
          transform: 'translateY(-1px)',
        },
      }),
      text: ({ theme }: { theme: Theme }) => ({
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}10`,
          transform: 'translateY(-1px)',
        },
      }),
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
              boxShadow: `0 0 0 3px ${theme.palette.primary.main}30`,
            },
          },
        },
      }),
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
  
  // Category colors for books
  categories: {
    fiction: '#8b5cf6',      // Purple
    nonfiction: '#10b981',   // Emerald
    biography: '#f59e0b',    // Amber
    science: '#3b82f6',     // Blue
    history: '#ef4444',     // Red
    mystery: '#6366f1',     // Indigo
    romance: '#ec4899',     // Pink
    fantasy: '#8b5cf6',     // Purple
    children: '#10b981',    // Green
    reference: '#6b7280',   // Gray
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
        contrastText: '#000000',
      },
    error: {
      main: '#ef4444',        // Modern red
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',        // Warm amber
      light: '#fbbf24', 
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',        // Modern blue
      light: '#60a5fa',
      dark: '#2563eb',
    },
    success: {
      main: '#10b981',        // Modern emerald
      light: '#34d399',
      dark: '#059669',
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
          borderRadius: '6px',
          margin: '0 4px',
          minHeight: '48px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.primary.contrastText,
            boxShadow: `0 2px 4px ${theme.palette.primary.main}40`,
          },
          '&:hover:not(.Mui-selected)': {
            backgroundColor: `${theme.palette.primary.main}10`,
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
        contrastText: '#000000',
      },
    error: {
      main: '#f87171',        // Lighter red for dark mode
      light: '#fca5a5',
      dark: '#ef4444',
    },
    warning: {
      main: '#fbbf24',        // Lighter amber for dark mode
      light: '#fde047',
      dark: '#f59e0b',
    },
    info: {
      main: '#60a5fa',        // Lighter blue for dark mode
      light: '#93c5fd',
      dark: '#3b82f6',
    },
    success: {
      main: '#34d399',        // Lighter emerald for dark mode
      light: '#6ee7b7',
      dark: '#10b981',
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
          borderRadius: '6px',
          margin: '0 4px',
          minHeight: '48px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.primary.contrastText,
            boxShadow: `0 2px 4px ${theme.palette.primary.main}50`,
          },
          '&:hover:not(.Mui-selected)': {
            backgroundColor: `${theme.palette.primary.main}20`,
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

export const lightTheme = createTheme(createThemeOptions(false, 'indigo'))
export const darkTheme = createTheme(createThemeOptions(true, 'indigo'))

// Export default theme for backwards compatibility
export const theme = lightTheme

export function createAppTheme(isDark: boolean, variant: ThemeVariant = 'indigo') {
  return createTheme(createThemeOptions(isDark, variant))
}

// Export enhanced colors for use in components
export { enhancedColors }

// Utility function to get category color
export function getCategoryColor(category: string): string {
  const normalizedCategory = category.toLowerCase().replace(/[^a-z]/g, '')
  return enhancedColors.categories[normalizedCategory as keyof typeof enhancedColors.categories] || enhancedColors.neutral[500]
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