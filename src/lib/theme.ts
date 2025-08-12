import { createTheme, ThemeOptions, Theme } from '@mui/material/styles'

// Extend MUI theme to include custom properties
declare module '@mui/material/styles' {
  interface TypeBackground {
    elevated?: string
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
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)'
          : 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)',
        boxShadow: theme.palette.mode === 'light'
          ? '0 1px 3px rgba(79, 70, 229, 0.2), 0 1px 2px rgba(79, 70, 229, 0.12)'
          : '0 1px 3px rgba(165, 180, 252, 0.3), 0 1px 2px rgba(165, 180, 252, 0.15)',
        '&:hover': {
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)'
            : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 4px 6px rgba(79, 70, 229, 0.25), 0 2px 4px rgba(79, 70, 229, 0.15)'
            : '0 4px 6px rgba(129, 140, 248, 0.35), 0 2px 4px rgba(129, 140, 248, 0.2)',
          transform: 'translateY(-1px)',
        },
      }),
      outlined: ({ theme }: { theme: Theme }) => ({
        borderColor: theme.palette.primary.main,
        '&:hover': {
          borderColor: theme.palette.primary.dark,
          backgroundColor: theme.palette.mode === 'light'
            ? 'rgba(99, 102, 241, 0.04)'
            : 'rgba(129, 140, 248, 0.08)',
          transform: 'translateY(-1px)',
        },
      }),
      text: ({ theme }: { theme: Theme }) => ({
        '&:hover': {
          backgroundColor: theme.palette.mode === 'light'
            ? 'rgba(99, 102, 241, 0.04)'
            : 'rgba(129, 140, 248, 0.08)',
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
              boxShadow: theme.palette.mode === 'light'
                ? '0 0 0 3px rgba(99, 102, 241, 0.1)'
                : '0 0 0 3px rgba(129, 140, 248, 0.2)',
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

const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: enhancedColors.primary[600], // Darker indigo for better contrast (4.5:1+)
      light: enhancedColors.primary[400],
      dark: enhancedColors.primary[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: enhancedColors.secondary[500], // Warm amber
      light: enhancedColors.secondary[300],
      dark: enhancedColors.secondary[700],
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
            background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
          },
          '&:hover:not(.Mui-selected)': {
            backgroundColor: 'rgba(79, 70, 229, 0.04)',
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
      main: enhancedColors.primary[300], // Even lighter indigo for better contrast on dark backgrounds
      light: enhancedColors.primary[200],
      dark: enhancedColors.primary[400],
      contrastText: '#000000',
    },
    secondary: {
      main: enhancedColors.secondary[400], // Lighter amber for dark mode
      light: enhancedColors.secondary[300],
      dark: enhancedColors.secondary[500],
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
      default: '#0f172a',     // Rich dark slate
      paper: '#1e293b',      // Elevated dark surfaces
      elevated: '#334155',   // Higher elevated surfaces
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
          backgroundColor: '#334155',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
          border: '1px solid #475569',
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
            background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)',
            color: '#000000',
            boxShadow: '0 2px 4px rgba(165, 180, 252, 0.3)',
          },
          '&:hover:not(.Mui-selected)': {
            backgroundColor: 'rgba(165, 180, 252, 0.08)',
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
            backgroundColor: 'rgba(129, 140, 248, 0.08)',
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
          backgroundColor: '#1e1e1e', // Ensure dialog has proper dark background
          color: 'rgba(255, 255, 255, 0.95)', // Ensure text is white in dark mode
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

export const lightTheme = createTheme(lightThemeOptions)
export const darkTheme = createTheme(darkThemeOptions)

// Export default theme for backwards compatibility
export const theme = lightTheme

export function createAppTheme(isDark: boolean) {
  return isDark ? darkTheme : lightTheme
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