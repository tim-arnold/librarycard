'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Pagination
} from '@mui/material'
import {
  ArrowBack,
  MoreVert,
  RemoveCircle,
  Visibility,
  Edit,
  PersonAdd,
  LibraryBooks
} from '@mui/icons-material'
import type { Series, EnhancedBook, SeriesBooksResponse } from '@/lib/types'
import { getSeriesBooks, removeBookFromSeries } from '@/lib/api'
import { useSeries } from '@/hooks/useSeries'
import AddBooksToSeriesModal from '../modals/AddBooksToSeriesModal'

interface SeriesBookViewProps {
  series: Series
  onBack: () => void
  onBookAction?: (book: EnhancedBook) => void
  availableBooks?: EnhancedBook[]
}

const BOOKS_PER_PAGE = 24

export default function SeriesBookView({ 
  series, 
  onBack, 
  onBookAction, 
  availableBooks = [] 
}: SeriesBookViewProps) {
  const { addBooksToSeries, removeBookFromSeries: removeFromSeriesHook } = useSeries()
  
  const [books, setBooks] = useState<EnhancedBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)
  
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedBook, setSelectedBook] = useState<EnhancedBook | null>(null)
  const [isAddBooksModalOpen, setIsAddBooksModalOpen] = useState(false)

  const fetchSeriesBooks = async (page: number = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      const response: SeriesBooksResponse = await getSeriesBooks(series.id, page, BOOKS_PER_PAGE)
      setBooks(response.books)
      setTotalBooks(response.total)
      setTotalPages(Math.ceil(response.total / BOOKS_PER_PAGE))
    } catch (err) {
      console.error('Failed to fetch series books:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch books')
      setBooks([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSeriesBooks(currentPage)
  }, [series.id, currentPage])

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, book: EnhancedBook) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedBook(book)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedBook(null)
  }

  const handleRemoveBook = async (book: EnhancedBook) => {
    if (window.confirm(`Remove "${book.title}" from this series?`)) {
      const success = await removeFromSeriesHook(series.id, book.id)
      if (success) {
        // Refresh the books list
        await fetchSeriesBooks(currentPage)
      }
    }
    handleMenuClose()
  }

  const handleViewBook = (book: EnhancedBook) => {
    if (onBookAction) {
      onBookAction(book)
    }
    handleMenuClose()
  }

  const handleAddBooks = async (seriesId: string, bookIds: string[]) => {
    const result = await addBooksToSeries(seriesId, bookIds)
    if (result) {
      // Refresh the books list
      await fetchSeriesBooks(currentPage)
    }
    return result
  }

  if (isLoading && books.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={onBack}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ArrowBack fontSize="small" />
            Series
          </Link>
          <Typography color="text.primary">{series.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4" component="h1">
                {series.name}
              </Typography>
              {series.color && (
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: series.color,
                    borderRadius: '50%',
                    border: '1px solid #ddd'
                  }}
                />
              )}
            </Box>
            
            {series.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {series.description}
              </Typography>
            )}
            
            <Chip
              icon={<LibraryBooks />}
              label={`${totalBooks} book${totalBooks !== 1 ? 's' : ''}`}
              color="primary"
            />
          </Box>
          
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setIsAddBooksModalOpen(true)}
            disabled={availableBooks.length === 0}
          >
            Add Books
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {books.length === 0 && !isLoading ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <LibraryBooks sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Books in Series
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This series doesn't have any books yet. Add some books to get started!
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setIsAddBooksModalOpen(true)}
              disabled={availableBooks.length === 0}
            >
              Add Books to Series
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: 'repeat(auto-fit, minmax(250px, 1fr))',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)'
            },
            gap: 3
          }}>
            {books.map((book) => (
              <Card
                key={book.id}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: onBookAction ? 'pointer' : 'default',
                  '&:hover': onBookAction ? { boxShadow: 4 } : {}
                }}
                onClick={() => onBookAction && onBookAction(book)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={book.thumbnail || '/book-placeholder.png'}
                  alt={book.title}
                  sx={{ objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" noWrap title={book.title}>
                    {book.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    by {book.authors.join(', ')}
                  </Typography>
                  {book.status && (
                    <Chip
                      label={book.status === 'available' ? 'Available' : 'Checked Out'}
                      size="small"
                      color={book.status === 'available' ? 'success' : 'warning'}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button size="small" startIcon={<Visibility />}>
                    View
                  </Button>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, book)}
                  >
                    <MoreVert />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {onBookAction && (
          <MenuItem onClick={() => selectedBook && handleViewBook(selectedBook)}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedBook && handleRemoveBook(selectedBook)}>
          <ListItemIcon>
            <RemoveCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove from Series</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Books Modal */}
      <AddBooksToSeriesModal
        isOpen={isAddBooksModalOpen}
        onClose={() => setIsAddBooksModalOpen(false)}
        onAddBooks={handleAddBooks}
        series={series}
        availableBooks={availableBooks}
      />
    </Box>
  )
}