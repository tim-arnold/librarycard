// Utility to calculate contrast ratios for WCAG compliance
// WCAG 2.1 AA requirements: 4.5:1 for normal text, 3:1 for large text (18pt+)

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbaToRgb(rgba: string, bg: string = '#ffffff'): string {
  // Parse rgba values
  const match = rgba.match(/rgba?\(([^)]+)\)/);
  if (!match) return rgba;
  
  const values = match[1].split(',').map(v => v.trim());
  const r = parseInt(values[0]);
  const g = parseInt(values[1]);
  const b = parseInt(values[2]);
  const a = values[3] ? parseFloat(values[3]) : 1;
  
  if (a === 1) return `rgb(${r}, ${g}, ${b})`;
  
  // Convert background to RGB
  const bgRgb = hexToRgb(bg);
  if (!bgRgb) return rgba;
  
  // Alpha blend with background
  const blendedR = Math.round((1 - a) * bgRgb.r + a * r);
  const blendedG = Math.round((1 - a) * bgRgb.g + a * g);
  const blendedB = Math.round((1 - a) * bgRgb.b + a * b);
  
  return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
}

function getLuminance(color: string): number {
  // Convert color to RGB
  let rgb: { r: number; g: number; b: number } | null = null;
  
  if (color.startsWith('#')) {
    rgb = hexToRgb(color);
  } else if (color.startsWith('rgb')) {
    const converted = rgbaToRgb(color);
    const match = converted.match(/rgb\(([^)]+)\)/);
    if (match) {
      const values = match[1].split(',').map(v => parseInt(v.trim()));
      rgb = { r: values[0], g: values[1], b: values[2] };
    }
  }
  
  if (!rgb) return 0;
  
  // Convert to relative luminance
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastCheck {
  combination: string;
  foreground: string;
  background: string;
  ratio: number;
  wcagAA: boolean;
  wcagAALarge: boolean;
  status: 'pass' | 'fail' | 'warning';
}

// Current theme colors for analysis
const lightThemeColors = {
  backgrounds: {
    default: '#fafbfc',
    paper: '#ffffff',
    elevated: '#f8fafc',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
  },
  primary: '#6366f1',
  secondary: '#f59e0b',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  success: '#10b981',
};

const darkThemeColors = {
  backgrounds: {
    default: '#0f172a',
    paper: '#1e293b',
    elevated: '#334155',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.75)',
  },
  primary: '#818cf8',
  secondary: '#fbbf24',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  success: '#34d399',
};

export function checkAccessibilityContrast(): {
  light: ContrastCheck[];
  dark: ContrastCheck[];
  summary: {
    light: { pass: number; fail: number; warning: number };
    dark: { pass: number; fail: number; warning: number };
  };
} {
  const lightChecks: ContrastCheck[] = [];
  const darkChecks: ContrastCheck[] = [];
  
  // Light mode checks
  Object.entries(lightThemeColors.backgrounds).forEach(([bgName, bgColor]) => {
    Object.entries(lightThemeColors.text).forEach(([textName, textColor]) => {
      const ratio = getContrastRatio(textColor, bgColor);
      const wcagAA = ratio >= 4.5;
      const wcagAALarge = ratio >= 3.0;
      
      lightChecks.push({
        combination: `${textName} text on ${bgName} background`,
        foreground: textColor,
        background: bgColor,
        ratio: Math.round(ratio * 100) / 100,
        wcagAA,
        wcagAALarge,
        status: wcagAA ? 'pass' : wcagAALarge ? 'warning' : 'fail'
      });
    });
    
    // Check primary color links/buttons on backgrounds
    const primaryRatio = getContrastRatio(lightThemeColors.primary, bgColor);
    lightChecks.push({
      combination: `primary color on ${bgName} background`,
      foreground: lightThemeColors.primary,
      background: bgColor,
      ratio: Math.round(primaryRatio * 100) / 100,
      wcagAA: primaryRatio >= 4.5,
      wcagAALarge: primaryRatio >= 3.0,
      status: primaryRatio >= 4.5 ? 'pass' : primaryRatio >= 3.0 ? 'warning' : 'fail'
    });
  });
  
  // Dark mode checks  
  Object.entries(darkThemeColors.backgrounds).forEach(([bgName, bgColor]) => {
    Object.entries(darkThemeColors.text).forEach(([textName, textColor]) => {
      const ratio = getContrastRatio(textColor, bgColor);
      const wcagAA = ratio >= 4.5;
      const wcagAALarge = ratio >= 3.0;
      
      darkChecks.push({
        combination: `${textName} text on ${bgName} background`,
        foreground: textColor,
        background: bgColor,
        ratio: Math.round(ratio * 100) / 100,
        wcagAA,
        wcagAALarge,
        status: wcagAA ? 'pass' : wcagAALarge ? 'warning' : 'fail'
      });
    });
    
    // Check primary color links/buttons on backgrounds  
    const primaryRatio = getContrastRatio(darkThemeColors.primary, bgColor);
    darkChecks.push({
      combination: `primary color on ${bgName} background`,
      foreground: darkThemeColors.primary,
      background: bgColor,
      ratio: Math.round(primaryRatio * 100) / 100,
      wcagAA: primaryRatio >= 4.5,
      wcagAALarge: primaryRatio >= 3.0,
      status: primaryRatio >= 4.5 ? 'pass' : primaryRatio >= 3.0 ? 'warning' : 'fail'
    });
  });
  
  // Calculate summaries
  const lightSummary = lightChecks.reduce((acc, check) => {
    acc[check.status]++;
    return acc;
  }, { pass: 0, fail: 0, warning: 0 });
  
  const darkSummary = darkChecks.reduce((acc, check) => {
    acc[check.status]++;
    return acc;
  }, { pass: 0, fail: 0, warning: 0 });
  
  return {
    light: lightChecks,
    dark: darkChecks,
    summary: {
      light: lightSummary,
      dark: darkSummary
    }
  };
}

// Utility to convert rgba to hex for calculations
export function rgbaToHex(rgba: string, background: string = '#ffffff'): string {
  const rgb = rgbaToRgb(rgba, background);
  const match = rgb.match(/rgb\(([^)]+)\)/);
  if (!match) return rgba;
  
  const values = match[1].split(',').map(v => parseInt(v.trim()));
  const r = values[0].toString(16).padStart(2, '0');
  const g = values[1].toString(16).padStart(2, '0');
  const b = values[2].toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

export { getContrastRatio, getLuminance };