'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Star,
  NewReleases,
  TrendingUp,
  MenuBook,
} from '@mui/icons-material'
import type { LibraryActivityResponse, SidebarPreferences } from '@/lib/types'
import { getApiBaseUrl } from '@/lib/apiConfig'
import RecentReviews from './RecentReviews'
import NewlyAdded from './NewlyAdded'
import PopularBooks from './PopularBooks'

interface LibrarySidebarProps {
  onBookClick?: (bookId: string) => void
  onAuthorClick?: (authorName: string) => void
  onFilterApply?: (filterType: string, value: string) => void
}

export default function LibrarySidebar({
  onBookClick,
  onAuthorClick,
  onFilterApply,
}: LibrarySidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // State
  const [preferences, setPreferences] = useState<SidebarPreferences>({
    collapsed: isMobile,
    activeSection: 'reviews',
  })
  const [activityData, setActivityData] = useState<LibraryActivityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load sidebar preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('library-sidebar-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences({
          collapsed: isMobile ? true : parsed.collapsed || false,
          activeSection: parsed.activeSection || 'reviews',
        })
      } catch (e) {
        console.warn('Failed to parse sidebar preferences:', e)
      }
    }
  }, [isMobile])

  // Save preferences to localStorage
  const updatePreferences = (updates: Partial<SidebarPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    localStorage.setItem('library-sidebar-preferences', JSON.stringify(newPreferences))
  }

  // Fetch activity data
  const fetchActivityData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const apiUrl = getApiBaseUrl()
      const response = await fetch(`${apiUrl}/api/library/activity?limit=8`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-email') || ''}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.status}`)
      }

      const data = await response.json()
      setActivityData(data)
    } catch (err) {
      console.error('Error fetching library activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchActivityData()
  }, [])

  // Toggle collapsed state
  const toggleCollapsed = () => {
    updatePreferences({ collapsed: !preferences.collapsed })
  }

  // Section definitions
  const sections = [
    {
      id: 'reviews' as const,
      title: 'Recent Reviews',
      icon: <Star />,
      color: theme.palette.warning.main,
      component: RecentReviews,
      data: activityData?.recent_reviews || [],
    },
    {
      id: 'new' as const,
      title: 'Newly Added',
      icon: <NewReleases />,
      color: theme.palette.success.main,
      component: NewlyAdded,
      data: activityData?.newly_added || [],
    },
    {
      id: 'popular' as const,
      title: 'Popular Books',
      icon: <TrendingUp />,
      color: theme.palette.primary.main,
      component: PopularBooks,
      data: activityData?.popular_books || [],
    },
  ]

  const sidebarWidth = preferences.collapsed ? 56 : 320

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'sticky',
        top: 16,
        height: 'fit-content',
        maxHeight: 'calc(100vh - 100px)',
        width: sidebarWidth,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 72,
        }}
      >
        <Collapse in={!preferences.collapsed} orientation="horizontal">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBook color="primary" />
            <Typography variant="h6" component="h2" noWrap>
              Library Activity
            </Typography>
          </Box>
        </Collapse>
        
        <IconButton 
          onClick={toggleCollapsed}
          size="small"
          sx={{ 
            ml: preferences.collapsed ? 0 : 'auto',
            flexShrink: 0,
          }}
        >
          {preferences.collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* Content */}
      {!preferences.collapsed && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Loading activity...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">
                {error}
              </Alert>
            </Box>
          ) : (
            <Box>
              {sections.map((section, index) => {
                const SectionComponent = section.component
                const isActive = preferences.activeSection === section.id
                const hasData = section.data.length > 0

                return (
                  <React.Fragment key={section.id}>
                    {/* Section Header */}
                    <Box
                      onClick={() => updatePreferences({ activeSection: section.id })}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: isActive ? 'action.selected' : 'transparent',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderLeft: isActive ? 3 : 0,
                        borderColor: section.color,
                      }}
                    >
                      <Box sx={{ color: section.color }}>
                        {section.icon}
                      </Box>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: isActive ? 600 : 400,
                          flex: 1,
                        }}
                      >
                        {section.title}
                      </Typography>
                      {hasData && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            bgcolor: section.color,
                            color: 'white',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: '0.7rem',
                          }}
                        >
                          {section.data.length}
                        </Typography>
                      )}
                    </Box>

                    {/* Section Content */}
                    <Collapse in={isActive}>
                      <Box sx={{ px: 1, pb: 2 }}>
                        <SectionComponent
                          items={section.data}
                          onBookClick={onBookClick}
                          onAuthorClick={onAuthorClick}
                          onFilterApply={onFilterApply}
                        />
                      </Box>
                    </Collapse>

                    {index < sections.length - 1 && <Divider />}
                  </React.Fragment>
                )
              })}

              {!loading && activityData && 
               Object.values(activityData).every(arr => arr.length === 0) && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity found.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add some books and rate them to see activity here!
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Collapsed state indicators */}
      {preferences.collapsed && activityData && (
        <Box sx={{ p: 1 }}>
          {sections.map((section) => (
            <IconButton
              key={section.id}
              onClick={() => updatePreferences({ collapsed: false, activeSection: section.id })}
              size="small"
              sx={{
                width: '100%',
                mb: 0.5,
                position: 'relative',
                color: section.color,
              }}
              title={section.title}
            >
              {section.icon}
              {section.data.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 12,
                    height: 12,
                    bgcolor: section.color,
                    borderRadius: '50%',
                    fontSize: '0.6rem',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {Math.min(section.data.length, 9)}
                </Box>
              )}
            </IconButton>
          ))}
        </Box>
      )}
    </Paper>
  )
}