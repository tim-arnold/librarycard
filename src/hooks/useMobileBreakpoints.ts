import { useTheme, useMediaQuery } from '@mui/material'

export interface MobileBreakpoints {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isSmallMobile: boolean
  isLargeMobile: boolean
}

export function useMobileBreakpoints(): MobileBreakpoints {
  const theme = useTheme()

  // Standardized breakpoint definitions
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm')) // < 600px
  const isMobile = useMediaQuery(theme.breakpoints.down('md')) // < 960px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')) // 600px - 1200px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')) // >= 1200px
  const isLargeMobile = useMediaQuery(theme.breakpoints.between('sm', 'md')) // 600px - 960px

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeMobile,
  }
}

export default useMobileBreakpoints