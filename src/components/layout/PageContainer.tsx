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
    // Helper function to check if we should skip fade for tab navigation
    const shouldSkipFade = (oldPath: string, newPath: string) => {
      // Skip fade for library filter changes: /library -> /library/location/shelf
      const isLibraryFilter = (oldPath.startsWith('/library') && newPath.startsWith('/library'))
      
      // Skip fade for admin tab changes: /admin -> /admin/users
      const isAdminTab = (oldPath.startsWith('/admin') && newPath.startsWith('/admin'))
      
      // Skip fade for add-books tab changes: /add-books -> /add-books/scan
      const isAddBooksTab = (oldPath.startsWith('/add-books') && newPath.startsWith('/add-books'))
      
      return isLibraryFilter || isAdminTab || isAddBooksTab
    }
    
    // Only trigger fade if pathname actually changed and it's not a tab/filter change
    if (prevPathnameRef.current !== pathname) {
      const skipFade = shouldSkipFade(prevPathnameRef.current, pathname)
      prevPathnameRef.current = pathname
      
      if (skipFade) {
        // For tab/filter changes, update directly without fade
        setDisplayChildren(children)
        setFadeIn(true)
      } else {
        // For main navigation, use fade transition
        setFadeIn(false)
        
        const timer = setTimeout(() => {
          setDisplayChildren(children)
          setFadeIn(true)
        }, 150)
        
        return () => clearTimeout(timer)
      }
    } else {
      // If pathname didn't change, just update children directly
      setDisplayChildren(children)
      setFadeIn(true)
    }
  }, [pathname, children])

  return (
    <Container maxWidth={maxWidth} sx={{ pb: 2 }}>
      <Paper sx={{ p: padding, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Fade in={fadeIn} timeout={{ enter: 300, exit: 150 }}>
          <Box sx={{ minHeight: '400px' }}>
            {displayChildren}
          </Box>
        </Fade>
      </Paper>
    </Container>
  )
}