'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Container, Paper, Fade, Box } from '@mui/material'

interface PageContainerProps {
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  padding?: number
}

export default function PageContainer({ 
  children, 
  maxWidth = 'xl', 
  padding = 3 
}: PageContainerProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [fadeIn, setFadeIn] = useState(true)
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    // Only trigger fade if pathname actually changed (for main navigation)
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      setFadeIn(false)
      
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setFadeIn(true)
      }, 150)
      
      return () => clearTimeout(timer)
    } else {
      // If pathname didn't change, just update children directly
      setDisplayChildren(children)
      setFadeIn(true)
    }
  }, [pathname, children])

  return (
    <Container maxWidth={maxWidth} sx={{ py: 2 }}>
      <Paper sx={{ p: padding }}>
        <Fade in={fadeIn} timeout={{ enter: 300, exit: 150 }}>
          <Box sx={{ minHeight: '400px' }}>
            {displayChildren}
          </Box>
        </Fade>
      </Paper>
    </Container>
  )
}