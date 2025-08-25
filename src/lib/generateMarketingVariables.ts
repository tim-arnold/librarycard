import { Theme } from '@mui/material/styles'
import { ThemeVariant } from './theme'

/**
 * Generates marketing CSS variables from Material-UI theme
 * This creates a bridge between the dynamic Material-UI theme system
 * and the static CSS variables used by marketing components
 */
export function generateMarketingVariables(theme: Theme, themeVariant: ThemeVariant): Record<string, string> {
  const isDark = theme.palette.mode === 'dark'
  
  return {
    // Primary Brand Colors - derived from theme
    '--marketing-primary': theme.palette.primary.main,
    '--marketing-primary-hover': theme.palette.primary.dark,
    '--marketing-primary-dark': theme.palette.primary.dark,
    '--marketing-primary-light': theme.palette.primary.light,
    
    // Secondary Colors - derived from theme
    '--marketing-secondary': theme.palette.secondary.main,
    '--marketing-secondary-hover': theme.palette.secondary.dark,
    '--marketing-secondary-dark': theme.palette.secondary.dark,
    '--marketing-secondary-light': theme.palette.secondary.light,
    
    // Base Colors - theme-aware
    '--marketing-white': isDark ? theme.palette.background.paper : '#ffffff',
    '--marketing-black': isDark ? '#ffffff' : '#000000',
    
    // Neutral Colors - adaptive grayscale
    '--marketing-gray-50': isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
    '--marketing-gray-100': isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6',
    '--marketing-gray-200': isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb',
    '--marketing-gray-300': isDark ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db',
    '--marketing-gray-400': isDark ? 'rgba(255, 255, 255, 0.3)' : '#9ca3af',
    '--marketing-gray-500': isDark ? 'rgba(255, 255, 255, 0.5)' : '#6b7280',
    '--marketing-gray-600': isDark ? 'rgba(255, 255, 255, 0.6)' : '#4b5563',
    '--marketing-gray-700': isDark ? 'rgba(255, 255, 255, 0.75)' : '#374151',
    '--marketing-gray-800': isDark ? 'rgba(255, 255, 255, 0.85)' : '#1f2937',
    '--marketing-gray-900': isDark ? 'rgba(255, 255, 255, 0.95)' : '#111827',
    
    // Background Colors - theme-aware
    '--marketing-bg-default': theme.palette.background.default,
    '--marketing-bg-paper': theme.palette.background.paper,
    '--marketing-bg-elevated': (theme.palette.background as any).elevated || theme.palette.background.paper,
    
    // Text Colors - theme-aware
    '--marketing-text-primary': theme.palette.text.primary,
    '--marketing-text-secondary': theme.palette.text.secondary,
    '--marketing-text-disabled': theme.palette.text.disabled,
    
    // Semantic Colors - from theme
    '--marketing-success': theme.palette.success.main,
    '--marketing-success-light': theme.palette.success.light,
    '--marketing-success-dark': theme.palette.success.dark,
    '--marketing-warning': theme.palette.warning.main,
    '--marketing-warning-light': theme.palette.warning.light,
    '--marketing-warning-dark': theme.palette.warning.dark,
    '--marketing-error': theme.palette.error.main,
    '--marketing-error-light': theme.palette.error.light,
    '--marketing-error-dark': theme.palette.error.dark,
    '--marketing-info': theme.palette.info.main,
    '--marketing-info-light': theme.palette.info.light,
    '--marketing-info-dark': theme.palette.info.dark,
    
    // Typography - from theme
    '--marketing-font-primary': theme.typography.fontFamily || 'Inter, system-ui, sans-serif',
    '--marketing-font-display': (theme.typography as any).fontFamilyDisplay || theme.typography.fontFamily || 'Inter, system-ui, sans-serif',
    '--marketing-font-mono': 'SF Mono, Monaco, Inconsolata, Roboto Mono, Consolas, Courier New, monospace',
    
    // Font Sizes - from Material-UI typography
    '--marketing-text-xs': '0.75rem',
    '--marketing-text-sm': '0.875rem',
    '--marketing-text-base': '1rem',
    '--marketing-text-lg': (theme.typography.h6.fontSize as string) || '1.125rem',
    '--marketing-text-xl': (theme.typography.h5.fontSize as string) || '1.25rem',
    '--marketing-text-2xl': (theme.typography.h4.fontSize as string) || '1.5rem',
    '--marketing-text-3xl': (theme.typography.h3.fontSize as string) || '1.875rem',
    '--marketing-text-4xl': (theme.typography.h2.fontSize as string) || '2.25rem',
    '--marketing-text-5xl': (theme.typography.h1.fontSize as string) || '3rem',
    '--marketing-text-6xl': '3.75rem',
    '--marketing-text-7xl': '4.5rem',
    
    // Font Weights - from theme
    '--marketing-font-light': '300',
    '--marketing-font-normal': '400',
    '--marketing-font-medium': '500',
    '--marketing-font-semibold': '600',
    '--marketing-font-bold': '700',
    '--marketing-font-extrabold': '800',
    '--marketing-font-black': '900',
    
    // Line Heights - from theme
    '--marketing-leading-tight': '1.25',
    '--marketing-leading-snug': '1.375',
    '--marketing-leading-normal': (theme.typography.body1.lineHeight as string) || '1.5',
    '--marketing-leading-relaxed': '1.625',
    '--marketing-leading-loose': '2',
    
    // Spacing Scale - keep existing for consistency
    '--marketing-spacing-0': '0',
    '--marketing-spacing-1': theme.spacing(0.5),
    '--marketing-spacing-2': theme.spacing(1),
    '--marketing-spacing-3': theme.spacing(1.5),
    '--marketing-spacing-4': theme.spacing(2),
    '--marketing-spacing-5': theme.spacing(2.5),
    '--marketing-spacing-6': theme.spacing(3),
    '--marketing-spacing-7': theme.spacing(3.5),
    '--marketing-spacing-8': theme.spacing(4),
    '--marketing-spacing-10': theme.spacing(5),
    '--marketing-spacing-12': theme.spacing(6),
    '--marketing-spacing-16': theme.spacing(8),
    '--marketing-spacing-20': theme.spacing(10),
    '--marketing-spacing-24': theme.spacing(12),
    '--marketing-spacing-32': theme.spacing(16),
    '--marketing-spacing-40': theme.spacing(20),
    '--marketing-spacing-48': theme.spacing(24),
    '--marketing-spacing-56': theme.spacing(28),
    '--marketing-spacing-64': theme.spacing(32),
    
    // Border Radius - keep existing scale
    '--marketing-radius-none': '0',
    '--marketing-radius-sm': '0.125rem',
    '--marketing-radius-base': '0.25rem',
    '--marketing-radius-md': '0.375rem',
    '--marketing-radius-lg': '0.5rem',
    '--marketing-radius-xl': '0.75rem',
    '--marketing-radius-2xl': '1rem',
    '--marketing-radius-3xl': '1.5rem',
    '--marketing-radius-full': '9999px',
    
    // Shadows - adaptive to theme mode
    '--marketing-shadow-sm': isDark 
      ? '0 1px 2px 0 rgb(0 0 0 / 0.3)' 
      : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '--marketing-shadow': isDark 
      ? '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)' 
      : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '--marketing-shadow-md': isDark 
      ? '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)' 
      : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '--marketing-shadow-lg': isDark 
      ? '0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.5)' 
      : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '--marketing-shadow-xl': isDark 
      ? '0 20px 25px -5px rgb(0 0 0 / 0.7), 0 8px 10px -6px rgb(0 0 0 / 0.6)' 
      : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '--marketing-shadow-2xl': isDark 
      ? '0 25px 50px -12px rgb(0 0 0 / 0.8)' 
      : '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '--marketing-shadow-inner': isDark 
      ? 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)' 
      : 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    
    // Z-Index Scale - keep existing
    '--marketing-z-0': '0',
    '--marketing-z-10': '10',
    '--marketing-z-20': '20',
    '--marketing-z-30': '30',
    '--marketing-z-40': '40',
    '--marketing-z-50': '50',
    
    // Container Max Widths - keep existing
    '--marketing-container-sm': '640px',
    '--marketing-container-md': '768px',
    '--marketing-container-lg': '1024px',
    '--marketing-container-xl': '1280px',
    '--marketing-container-2xl': '1536px',
    
    // Breakpoints - keep existing
    '--marketing-screen-sm': '640px',
    '--marketing-screen-md': '768px',
    '--marketing-screen-lg': '1024px',
    '--marketing-screen-xl': '1280px',
    '--marketing-screen-2xl': '1536px',
  }
}

/**
 * Injects marketing variables into document root
 * Call this whenever theme changes to update marketing components
 */
export function injectMarketingVariables(variables: Record<string, string>): void {
  Object.entries(variables).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value)
  })
}

/**
 * Helper to get marketing variables for a specific theme
 * Useful for SSR or testing contexts
 */
export function getMarketingVariablesForTheme(theme: Theme, themeVariant: ThemeVariant): Record<string, string> {
  return generateMarketingVariables(theme, themeVariant)
}