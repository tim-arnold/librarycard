'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  LibraryBooks,
  Visibility,
  PersonAdd
} from '@mui/icons-material'
import type { Series, EnhancedBook, CreateSeriesRequest, UpdateSeriesRequest } from '@/lib/types'
import { useSeries } from '@/hooks/useSeries'
import SeriesModal from '../modals/SeriesModal'
import AddBooksToSeriesModal from '../modals/AddBooksToSeriesModal'

interface SeriesManagerProps {
  availableBooks?: EnhancedBook[]
  onViewSeries?: (series: Series) => void
}

export default function SeriesManager({ availableBooks = [], onViewSeries }: SeriesManagerProps) {
  const { series, isLoading, error, createSeries, updateSeries, deleteSeries, addBooksToSeries } = useSeries()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [addingBooksToSeries, setAddingBooksToSeries] = useState<Series | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, series: Series) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedSeries(series)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedSeries(null)
  }

  const handleCreateSeries = async (data: CreateSeriesRequest | UpdateSeriesRequest) => {
    // For create, all fields in CreateSeriesRequest are required
    return await createSeries(data as CreateSeriesRequest)
  }

  const handleUpdateSeries = async (data: CreateSeriesRequest | UpdateSeriesRequest) => {
    if (!editingSeries) return null
    // For update, fields in UpdateSeriesRequest can be optional
    return await updateSeries(editingSeries.id, data as UpdateSeriesRequest)
  }

  const handleEditSeries = (series: Series) => {
    setEditingSeries(series)
    handleMenuClose()
  }

  const handleDeleteSeries = async (series: Series) => {
    if (window.confirm(`Are you sure you want to delete the series "${series.name}"? This will remove all books from the series but won't delete the books themselves.`)) {
      await deleteSeries(series.id)
    }
    handleMenuClose()
  }

  const handleAddBooksToSeries = (series: Series) => {
    setAddingBooksToSeries(series)
    handleMenuClose()
  }

  const handleViewSeries = (series: Series) => {
    if (onViewSeries) {
      onViewSeries(series)
    }
    handleMenuClose()
  }

  const handleAddBooks = async (seriesId: string, bookIds: string[]) => {
    return await addBooksToSeries(seriesId, bookIds)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          My Series
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Series
        </Button>
      </Box>

      {series.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <LibraryBooks sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Series Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first series to organize your books by theme, genre, or any custom grouping.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Your First Series
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: 'repeat(auto-fit, minmax(300px, 1fr))',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3
          }}>
            {series.map((seriesItem) => (
              <Card
                key={seriesItem.id}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: onViewSeries ? 'pointer' : 'default',
                  '&:hover': onViewSeries ? { boxShadow: 4 } : {},
                  borderLeft: seriesItem.color ? `4px solid ${seriesItem.color}` : 'none'
                }}
                onClick={() => onViewSeries && onViewSeries(seriesItem)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                      {seriesItem.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, seriesItem)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  
                  {seriesItem.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {seriesItem.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={<LibraryBooks />}
                      label={`${seriesItem.book_count || 0} books`}
                      size="small"
                      color={seriesItem.book_count && seriesItem.book_count > 0 ? 'primary' : 'default'}
                    />
                    {seriesItem.color && (
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          backgroundColor: seriesItem.color,
                          borderRadius: '50%',
                          border: '1px solid #ddd'
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<PersonAdd />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddBooksToSeries(seriesItem)
                    }}
                    disabled={availableBooks.length === 0}
                  >
                    Add Books
                  </Button>
                  {onViewSeries && seriesItem.book_count && seriesItem.book_count > 0 && (
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewSeries(seriesItem)
                      }}
                    >
                      View
                    </Button>
                  )}
                </CardActions>
              </Card>
            ))}
          </Box>

          <Fab
            color="primary"
            aria-label="add series"
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Add />
          </Fab>
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {onViewSeries && selectedSeries?.book_count && selectedSeries.book_count > 0 && (
          <MenuItem onClick={() => selectedSeries && handleViewSeries(selectedSeries)}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Series</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedSeries && handleAddBooksToSeries(selectedSeries)}>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Books</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedSeries && handleEditSeries(selectedSeries)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedSeries && handleDeleteSeries(selectedSeries)}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Modals */}
      <SeriesModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSeries}
      />

      <SeriesModal
        isOpen={Boolean(editingSeries)}
        onClose={() => setEditingSeries(null)}
        onSubmit={handleUpdateSeries}
        existingSeries={editingSeries}
      />

      <AddBooksToSeriesModal
        isOpen={Boolean(addingBooksToSeries)}
        onClose={() => setAddingBooksToSeries(null)}
        onAddBooks={handleAddBooks}
        series={addingBooksToSeries!}
        availableBooks={availableBooks}
      />
    </Box>
  )
}