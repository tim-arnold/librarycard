'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  MenuBook,
  Person,
  TrendingUp,
  Category,
  BarChart,
  LocationOn,
  LibraryBooks,
  Timeline,
  HealthAndSafety,
  FileCopy,
  ShowChart,
  Search,
} from '@mui/icons-material'
import { getApiBaseUrl } from '@/lib/apiConfig'

// Generate search URLs for data quality issues using special "missing:" search syntax
const generateDataQualitySearchUrl = (issueType: string): string => {
  const baseUrl = '/library'
  const searchParams = new URLSearchParams()
  
  switch (issueType) {
    case 'missing_genre':
      searchParams.set('search', 'missing:genre')
      break
    case 'missing_cover':
      searchParams.set('search', 'missing:cover')
      break
    case 'missing_location':
      searchParams.set('search', 'missing:location')
      break
    case 'missing_isbn':
      searchParams.set('search', 'missing:isbn')
      break
    case 'missing_authors':
      searchParams.set('search', 'missing:author')
      break
    case 'missing_title':
      searchParams.set('search', 'missing:title')
      break
    default:
      return baseUrl
  }
  
  return `${baseUrl}?${searchParams.toString()}`
}

interface AnalyticsData {
  overview: {
    totalBooks: number
    totalUsers: number
    totalLocations: number
    pendingRequests: number
    unorganizedBooks: number
    recentBooks: number
    recentCheckouts: number
  }
  booksPerLocation: Array<{
    name: string
    book_count: number
  }>
  activeUsers: Array<{
    first_name: string
    last_name: string
    email: string
    books_added: number
  }>
  topGenres: Array<{
    genre: string
    count: number
  }>
  collectionGrowth: Array<{
    date: string
    books_added: number
  }>
  dataQuality: {
    total_books: number
    missing_title: number
    missing_authors: number
    missing_cover: number
    missing_genre: number
    missing_location: number
    missing_isbn: number
    missing_publish_date: number
  }
  duplicates: Array<{
    title: string
    authors: string
    isbn: string
    book_count: number
    book_ids: string
  }>
  generatedAt: string
}

export default function AdminAnalytics() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (session?.user?.email && !dataLoaded) {
      loadAnalytics()
      setDataLoaded(true)
    }
  }, [session?.user?.email, dataLoaded])

  const loadAnalytics = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      const response = await fetch(`${getApiBaseUrl()}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load analytics')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setDataLoaded(false)
    loadAnalytics()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mr: 2 }} />
        <Typography color="text.secondary">
          Loading analytics...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!analytics) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No analytics data available
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} /> Library Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generated: {formatDate(analytics.generatedAt)}
        </Typography>
      </Box>

      <Box>
        {/* Books per Location and Most Active Users Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3, mb: 3 }}>
          <Card>
            <CardHeader 
              title={<><LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} /> Books per Location</>}
            />
            <CardContent>
              {analytics.booksPerLocation.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No locations with books found
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Location</TableCell>
                        <TableCell align="right">Books</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.booksPerLocation.map((location, index) => {
                        const percentage = Math.round((location.book_count / analytics.overview.totalBooks) * 100)
                        return (
                          <TableRow key={index}>
                            <TableCell>{location.name}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={location.book_count} 
                                size="small" 
                                color={location.book_count > 0 ? "primary" : "default"}
                              />
                            </TableCell>
                            <TableCell align="right">{percentage}%</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title={<><Person sx={{ mr: 1, verticalAlign: 'middle' }} /> Most Active Users</>}
            />
            <CardContent>
              {analytics.activeUsers.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No active users found
                </Typography>
              ) : (
                <List dense>
                  {analytics.activeUsers.slice(0, 8).map((user, index) => (
                    <ListItem key={index} divider={index < Math.min(analytics.activeUsers.length, 8) - 1}>
                      <ListItemIcon>
                        <TrendingUp color={index < 3 ? "primary" : "action"} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                        secondary={user.email}
                      />
                      <Chip 
                        label={`${user.books_added} books`}
                        size="small"
                        color={user.books_added > 10 ? "primary" : user.books_added > 5 ? "secondary" : "default"}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Second Row: Genres and Quick Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
          <Card>
            <CardHeader 
              title={<><LibraryBooks sx={{ mr: 1, verticalAlign: 'middle' }} /> Popular Genres</>}
            />
            <CardContent>
              {analytics.topGenres.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No genre data available
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Genre</TableCell>
                        <TableCell align="right">Books</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Visual</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.topGenres.map((genre, index) => {
                        const percentage = Math.round((genre.count / analytics.overview.totalBooks) * 100)
                        const barWidth = Math.max(percentage, 2) // Minimum 2% for visibility
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">#{index + 1}</Typography>
                                <Typography variant="body1">{genre.genre}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={genre.count} 
                                size="small" 
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="right">{percentage}%</TableCell>
                            <TableCell align="right" sx={{ width: 100 }}>
                              <Box sx={{ 
                                width: '100%', 
                                height: 8, 
                                backgroundColor: 'action.hover',
                                borderRadius: 1,
                                overflow: 'hidden'
                              }}>
                                <Box sx={{
                                  width: `${barWidth}%`,
                                  height: '100%',
                                  backgroundColor: index < 3 ? 'primary.main' : 'secondary.main',
                                  transition: 'width 0.3s ease'
                                }} />
                              </Box>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={<><TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} /> Quick Stats</>} />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg books per user:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {analytics.overview.totalUsers > 0 
                      ? Math.round(analytics.overview.totalBooks / analytics.overview.totalUsers) 
                      : 0}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg books per location:
                  </Typography>
                  <Typography variant="h6" color="secondary">
                    {analytics.overview.totalLocations > 0 
                      ? Math.round(analytics.overview.totalBooks / analytics.overview.totalLocations) 
                      : 0}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Organization rate:
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {analytics.overview.totalBooks > 0
                      ? Math.round(((analytics.overview.totalBooks - analytics.overview.unorganizedBooks) / analytics.overview.totalBooks) * 100)
                      : 0}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Monthly growth:
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    +{analytics.overview.recentBooks}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Recent activity:
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {analytics.overview.recentCheckouts} checkouts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Third Row: Collection Growth Chart and Data Quality Dashboard */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 3, mt: 3 }}>
          <Card>
            <CardHeader 
              title={<><ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} /> Collection Growth (Last 30 Days)</>}
            />
            <CardContent>
              {!analytics.collectionGrowth || analytics.collectionGrowth.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No books added in the last 30 days
                </Typography>
              ) : (
                <Box>
                  {/* Simple bar chart using CSS */}
                  <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: 200, mb: 2 }}>
                    {analytics.collectionGrowth?.map((day, index) => {
                      const maxBooks = Math.max(...(analytics.collectionGrowth?.map(d => d.books_added) || [1]), 1)
                      const height = (day.books_added / maxBooks) * 180
                      return (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <Typography variant="caption" sx={{ mb: 1, fontSize: '0.65rem' }}>
                            {day.books_added}
                          </Typography>
                          <Box
                            sx={{
                              width: '100%',
                              height: `${height}px`,
                              backgroundColor: 'primary.main',
                              borderRadius: '2px 2px 0 0',
                              minHeight: day.books_added > 0 ? '2px' : '0px',
                              transition: 'height 0.3s ease',
                            }}
                          />
                          <Typography variant="caption" sx={{ mt: 1, fontSize: '0.6rem', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total books added: {analytics.collectionGrowth?.reduce((sum, day) => sum + day.books_added, 0) || 0}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title={<><HealthAndSafety sx={{ mr: 1, verticalAlign: 'middle' }} /> Data Quality Score</>}
            />
            <CardContent>
              {analytics.dataQuality ? (
                <Box>
                  {/* Quality Score Circle */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    {(() => {
                      const total = analytics.dataQuality?.total_books || 0
                      const issues = (analytics.dataQuality?.missing_title || 0) + 
                                   (analytics.dataQuality?.missing_authors || 0) + 
                                   (analytics.dataQuality?.missing_cover || 0) + 
                                   (analytics.dataQuality?.missing_genre || 0) + 
                                   (analytics.dataQuality?.missing_location || 0) + 
                                   (analytics.dataQuality?.missing_isbn || 0)
                      const score = total > 0 ? Math.round(((total * 6 - issues) / (total * 6)) * 100) : 100
                      const color = score >= 80 ? 'success.main' : score >= 60 ? 'warning.main' : 'error.main'
                      
                      return (
                        <>
                          <Typography variant="h2" sx={{ color, fontWeight: 'bold' }}>
                            {score}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Overall Quality Score
                          </Typography>
                        </>
                      )
                    })()}
                  </Box>

                  {/* Quality Issues List */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[
                      { label: 'Missing Covers', count: analytics.dataQuality?.missing_cover || 0, type: 'missing_cover' },
                      { label: 'Missing Genres', count: analytics.dataQuality?.missing_genre || 0, type: 'missing_genre' },
                      { label: 'Missing Locations', count: analytics.dataQuality?.missing_location || 0, type: 'missing_location' },
                      { label: 'Missing ISBN', count: analytics.dataQuality?.missing_isbn || 0, type: 'missing_isbn' },
                      { label: 'Missing Authors', count: analytics.dataQuality?.missing_authors || 0, type: 'missing_authors' },
                      { label: 'Missing Titles', count: analytics.dataQuality?.missing_title || 0, type: 'missing_title' },
                    ].map((issue, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {issue.count > 0 ? (
                          <Link 
                            href={generateDataQualitySearchUrl(issue.type)} 
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              '&:hover': { 
                                color: 'primary.main',
                                cursor: 'pointer'
                              }
                            }}
                            title={`Click to review books with ${issue.label.toLowerCase()}`}
                            >
                              <Search sx={{ fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {issue.label}:
                              </Typography>
                            </Box>
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {issue.label}:
                          </Typography>
                        )}
                        <Chip 
                          label={issue.count} 
                          size="small" 
                          color={issue.count > 0 ? "error" : "success"}
                          variant={issue.count > 0 ? "filled" : "outlined"}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No data quality information available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Fourth Row: Potential Duplicates */}
        {analytics.duplicates && analytics.duplicates?.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Card>
              <CardHeader 
                title={<><FileCopy sx={{ mr: 1, verticalAlign: 'middle' }} /> Potential Duplicate Books</>}
              />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Author(s)</TableCell>
                        <TableCell>ISBN</TableCell>
                        <TableCell align="right">Copies</TableCell>
                        <TableCell align="right">Book IDs</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.duplicates?.map((duplicate, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {duplicate.title}
                            </Typography>
                          </TableCell>
                          <TableCell>{duplicate.authors}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {duplicate.isbn}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={duplicate.book_count} 
                              size="small" 
                              color="warning"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary">
                              {duplicate.book_ids}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  )
}