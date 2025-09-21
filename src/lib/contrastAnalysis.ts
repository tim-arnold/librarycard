// WCAG 2.1 Color Contrast Analysis for LibraryCard Themes
// This file analyzes all color combinations for accessibility compliance

interface ContrastResult {
  ratio: number
  aa: boolean      // WCAG AA (4.5:1 for normal text, 3:1 for large text)
  aaa: boolean     // WCAG AAA (7:1 for normal text, 4.5:1 for large text)
}

interface ColorCombination {
  foreground: string
  background: string
  description: string
  context: string
}

// Helper function to calculate luminance
function getLuminance(color: string): number {
  // Remove # if present
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

// Check WCAG compliance
function checkContrast(foreground: string, background: string, isLargeText = false): ContrastResult {
  const ratio = getContrastRatio(foreground, background)
  const aaThreshold = isLargeText ? 3 : 4.5
  const aaaThreshold = isLargeText ? 4.5 : 7

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= aaThreshold,
    aaa: ratio >= aaaThreshold
  }
}

// Define all critical color combinations to test
export const colorCombinationsToTest: ColorCombination[] = [
  // Light mode primary text combinations
  { foreground: 'rgba(0, 0, 0, 0.87)', background: '#ffffff', description: 'Primary text on paper', context: 'Light mode body text' },
  { foreground: 'rgba(0, 0, 0, 0.6)', background: '#ffffff', description: 'Secondary text on paper', context: 'Light mode secondary text' },
  { foreground: 'rgba(0, 0, 0, 0.87)', background: '#fafbfc', description: 'Primary text on default bg', context: 'Light mode page background' },

  // Dark mode primary text combinations
  { foreground: 'rgba(255, 255, 255, 0.95)', background: '#1e293b', description: 'Primary text on paper (dark)', context: 'Dark mode body text' },
  { foreground: 'rgba(255, 255, 255, 0.75)', background: '#1e293b', description: 'Secondary text on paper (dark)', context: 'Dark mode secondary text' },
  { foreground: 'rgba(255, 255, 255, 0.95)', background: '#0f172a', description: 'Primary text on default bg (dark)', context: 'Dark mode page background' },

  // Link colors in dark mode
  { foreground: '#bb86fc', background: '#1e293b', description: 'Link color on dark paper', context: 'Dark mode links' },
  { foreground: '#d1c4e9', background: '#1e293b', description: 'Link hover color on dark paper', context: 'Dark mode link hover' },

  // Primary theme colors (Indigo)
  { foreground: '#ffffff', background: '#4f46e5', description: 'White text on indigo primary', context: 'Primary buttons' },
  { foreground: '#ffffff', background: '#6366f1', description: 'White text on indigo main', context: 'Primary buttons' },

  // Green theme
  { foreground: '#ffffff', background: '#16a34a', description: 'White text on green primary', context: 'Green theme buttons' },
  { foreground: '#ffffff', background: '#22c55e', description: 'White text on green main', context: 'Green theme buttons' },

  // Red theme
  { foreground: '#ffffff', background: '#dc2626', description: 'White text on red primary', context: 'Red theme buttons' },
  { foreground: '#ffffff', background: '#ef4444', description: 'White text on red main', context: 'Red theme buttons' },

  // Blue theme
  { foreground: '#ffffff', background: '#2563eb', description: 'White text on blue primary', context: 'Blue theme buttons' },
  { foreground: '#ffffff', background: '#3b82f6', description: 'White text on blue main', context: 'Blue theme buttons' },

  // Purple theme
  { foreground: '#ffffff', background: '#9333ea', description: 'White text on purple primary', context: 'Purple theme buttons' },
  { foreground: '#ffffff', background: '#a855f7', description: 'White text on purple main', context: 'Purple theme buttons' },

  // Amber theme (potentially problematic)
  { foreground: '#000000', background: '#d97706', description: 'Black text on amber primary', context: 'Amber theme buttons' },
  { foreground: '#000000', background: '#f59e0b', description: 'Black text on amber main', context: 'Amber theme buttons' },
  { foreground: '#ffffff', background: '#d97706', description: 'White text on amber primary', context: 'Amber theme buttons alt' },
  { foreground: '#ffffff', background: '#f59e0b', description: 'White text on amber main', context: 'Amber theme buttons alt' },

  // Genre category colors that may be problematic
  { foreground: '#000000', background: '#fbbf24', description: 'Black text on yellow genre chip', context: 'Light mode genre chips' },
  { foreground: '#ffffff', background: '#fbbf24', description: 'White text on yellow genre chip', context: 'Dark mode genre chips' },
  { foreground: '#000000', background: '#fde047', description: 'Black text on bright yellow', context: 'Light mode accent colors' },
  { foreground: '#ffffff', background: '#fde047', description: 'White text on bright yellow', context: 'Dark mode accent colors' },

  // Error/Warning/Success colors
  { foreground: '#ffffff', background: '#ef4444', description: 'White text on error red', context: 'Error states' },
  { foreground: '#ffffff', background: '#f59e0b', description: 'White text on warning amber', context: 'Warning states' },
  { foreground: '#ffffff', background: '#10b981', description: 'White text on success green', context: 'Success states' },
]

// Function to analyze all combinations
export function analyzeContrastCompliance(): Record<string, ContrastResult> {
  const results: Record<string, ContrastResult> = {}

  colorCombinationsToTest.forEach((combo, index) => {
    const key = `${index}-${combo.description}`
    results[key] = checkContrast(combo.foreground, combo.background)
  })

  return results
}

// Function to get failing combinations
export function getFailingCombinations(): Array<ColorCombination & ContrastResult> {
  return colorCombinationsToTest.map((combo, index) => {
    const result = checkContrast(combo.foreground, combo.background)
    return { ...combo, ...result }
  }).filter(combo => !combo.aa)
}

// Function to generate accessibility report
export function generateAccessibilityReport(): string {
  const results = analyzeContrastCompliance()
  const failing = getFailingCombinations()

  let report = '# LibraryCard Color Contrast Accessibility Report\\n\\n'

  if (failing.length === 0) {
    report += '✅ All color combinations meet WCAG AA standards!\\n\\n'
  } else {
    report += `❌ Found ${failing.length} combinations that fail WCAG AA standards:\\n\\n`

    failing.forEach((combo, index) => {
      report += `## ${index + 1}. ${combo.description}\\n`
      report += `**Context**: ${combo.context}\\n`
      report += `**Colors**: ${combo.foreground} on ${combo.background}\\n`
      report += `**Contrast Ratio**: ${combo.ratio}:1\\n`
      report += `**WCAG AA**: ${combo.aa ? '✅' : '❌'} | **WCAG AAA**: ${combo.aaa ? '✅' : '❌'}\\n\\n`
    })
  }

  report += '## All Test Results\\n\\n'
  colorCombinationsToTest.forEach((combo, index) => {
    const key = `${index}-${combo.description}`
    const result = results[key]
    const status = result.aa ? '✅' : '❌'
    report += `${status} ${combo.description}: ${result.ratio}:1\\n`
  })

  return report
}

// Export for use in development/testing
export { checkContrast, getContrastRatio, getLuminance }