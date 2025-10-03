'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { Close, Download } from '@mui/icons-material'
import { getApiBaseUrl } from '@/lib/apiConfig'
import { useUserData } from '@/contexts/UserDataContext'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

interface Location {
  id: number
  name: string
}

export default function ExportModal({
  isOpen,
  onClose,
  userEmail,
}: ExportModalProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const { userRole } = useUserData()
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'

  useEffect(() => {
    if (isOpen) {
      fetchLocations()
    }
  }, [isOpen])

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/user/locations`, {
        headers: {
          Authorization: `Bearer ${userEmail}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
        if (data.length === 1) {
          setSelectedLocation(data[0].id.toString())
        }
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setError('')

    try {
      const locationParam = selectedLocation ? `&location_id=${selectedLocation}` : ''
      const response = await fetch(
        `${getApiBaseUrl()}/api/library/export?format=${format}${locationParam}`,
        {
          headers: {
            Authorization: `Bearer ${userEmail}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `library-export-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onClose()
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div">
          Export Library
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={loading}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Download your library data in your preferred format. This includes all your books,
          reviews, ratings, and checkout history.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {locations.length > 1 && isAdmin && (
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                value={selectedLocation}
                label="Location"
                onChange={(e) => setSelectedLocation(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="all">All Locations</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Select Format:
          </Typography>
          <RadioGroup
            value={format}
            onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
          >
            <FormControlLabel
              value="json"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    JSON
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Complete structured data with all relationships and metadata
                  </Typography>
                </Box>
              }
              disabled={loading}
            />
            <FormControlLabel
              value="csv"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    CSV
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Simplified book list for spreadsheet applications
                  </Typography>
                </Box>
              }
              disabled={loading}
            />
          </RadioGroup>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Your export will include all books, your personal reviews and ratings,
            tags, locations, and checkout history.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Download />}
        >
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
