'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { isAdmin, isSuperAdmin } from '@/lib/permissions'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material'
import {
  ExpandMore,
  Close,
  QrCodeScanner,
  LibraryBooks,
  LocationOn,
  Search,
  AccountCircle,
  AdminPanelSettings,
} from '@mui/icons-material'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && open) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setUserRole(data.user_role || 'user')
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch user role:', err)
          setUserRole('user')
          setLoading(false)
        })
    } else if (!open) {
      setLoading(true)
    }
  }, [session, open])

  if (!session) {
    return null
  }

  const userIsAdmin = isAdmin(userRole)
  const userIsSuperAdmin = isSuperAdmin(userRole)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          LibraryCard Help
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Welcome to LibraryCard!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your personal book library management system. This guide will help you make the most of all features available to you.
              </Typography>
              
              {userIsAdmin && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettings />
                    <Typography>
                      You have administrator privileges and can access all features including location management.
                    </Typography>
                  </Box>
                </Alert>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountCircle />
                    <Typography variant="h6">Getting Started</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" gutterBottom>
                    LibraryCard has {userIsAdmin ? 'three' : 'two'} main sections accessible via the top navigation, plus additional features in the profile dropdown:
                  </Typography>
                  <List>
                    <ListItem>
                      <QrCodeScanner sx={{ mr: 2 }} />
                      <ListItemText
                        primary="📱 Scan Books"
                        secondary="Add new books to your library using camera or manual entry"
                      />
                    </ListItem>
                    <ListItem>
                      <LibraryBooks sx={{ mr: 2 }} />
                      <ListItemText
                        primary="📖 My Library"
                        secondary="Browse and manage your book collection"
                      />
                    </ListItem>
                    {userIsAdmin && (
                      <ListItem>
                        <LocationOn sx={{ mr: 2 }} />
                        <ListItemText
                          primary="🏠 Location Management"
                          secondary="Organize your physical locations and shelves (Admin only)"
                        />
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <QrCodeScanner />
                    <Typography variant="h6">Adding Books</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Method 1: Camera Scanning
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="1. Click '📱 Scan Books' tab" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="2. Click 'Start Camera Scanner' button" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="3. Allow camera permissions when prompted" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="4. Position your phone camera over the book's barcode" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="5. Hold steady until the ISBN is detected" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="6. Book details will automatically load" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Method 2: Manual Entry
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="1. In the Scan Books section" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="2. Use the 'Or enter ISBN manually' field" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="3. Type the 13-digit ISBN (numbers only)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="4. Click 'Look Up Book'" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Completing the Book Entry
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="1. Verify Details: Check that title, author, and cover are correct" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="2. Select Shelf: Choose from the organized dropdown menu" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="3. Add Tags (optional): Enter comma-separated tags like 'fiction, mystery, favorite'" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="4. Click 'Save to Library'" />
                    </ListItem>
                  </List>

                  {!userIsAdmin && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      If you don&apos;t have any locations available, contact an administrator to set up locations and shelves.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>

              {userIsAdmin && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LocationOn />
                      <Typography variant="h6">Location Management (Admin Only)</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="h6" gutterBottom>
                      Creating Your First Location
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. Click '🏠 Location Management' tab" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Click 'Create Your First Location' button" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Enter a Location Name (e.g., 'Home', 'Office', 'Apartment')" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Add an optional Description" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="5. Click 'Create Location'" />
                      </ListItem>
                    </List>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      Each new location automatically gets a starter shelf called &quot;my first shelf&quot; that you can rename or organize as needed.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>
                      Managing Locations
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Adding More Locations
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. In Location Management, click '+ Add Location'" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Enter location name and description" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Click 'Create Location'" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Editing Locations
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. Find the location card" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Click the 'Edit' button" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Update name or description" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Click 'Update Location'" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Deleting Locations
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. Find the location card" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Click the 'Delete' button" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Confirm deletion (this will also delete all shelves in that location)" />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>
                      Managing Shelves
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Adding Shelves
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. Select a location by clicking on its card" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. In the 'Shelves' section, click '+ Add Shelf'" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Enter shelf name (e.g., 'Fiction', 'Cookbooks', 'Reference')" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Click 'Add Shelf'" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Editing Shelves
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. Find the shelf you want to edit" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Click the 'Edit' button on the shelf card" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Update the shelf name" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Click 'Update Shelf'" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Deleting Shelves
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. Find the shelf you want to remove" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Click the 'Delete' button on the shelf card" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Confirm deletion" />
                      </ListItem>
                    </List>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      Note: Deleting a shelf won&apos;t delete the books - they&apos;ll become unassigned and you can move them to other shelves.
                    </Alert>
                  </AccordionDetails>
                </Accordion>
              )}

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LibraryBooks />
                    <Typography variant="h6">Managing Your Library</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Library Overview
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    The &quot;📖 My Library&quot; section shows:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Total number of books" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Books distributed by location (visual summary)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Search and filter options" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Complete book collection" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Search and Filtering
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Search Box
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Search by book title" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Search by author name" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Search by ISBN" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Location Filter
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Filter to show books in specific locations" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Use 'All locations' to see everything" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Category Filter
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Filter by book genres/categories" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Categories are automatically detected from book data" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Updating Books
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Change Location
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="1. Find the book in your library" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="2. Use the location dropdown on the book card" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="3. Select new location" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="4. Changes save automatically" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Remove Books
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="1. Find the book you want to remove" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="2. Click the red 'Remove' button" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="3. Confirm deletion when prompted" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Search />
                    <Typography variant="h6">Tips for Effective Organization</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Tagging Best Practices
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Use consistent tag formats. Common useful tags:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Genre" 
                        secondary="fiction, non-fiction, mystery, sci-fi" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Status" 
                        secondary="read, unread, favorite, loaned" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Topic" 
                        secondary="cooking, history, reference, textbook" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Condition" 
                        secondary="new, used, rare" 
                      />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Search Tips
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Search is case-insensitive" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Partial matches work for titles and authors" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Use specific terms for better results" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Mobile Usage
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Camera Scanning
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Works best with phone cameras" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ensure good lighting" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Hold phone steady" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Position barcode clearly in camera view" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Portrait orientation recommended" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">Troubleshooting</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Common Issues
                  </Typography>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Book Not Found
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Try manual ISBN entry" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Check if ISBN is correct (13 digits)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Some very old books may not be in databases" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Camera Issues
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Ensure you're on HTTPS (required for camera access)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Check browser permissions for camera" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Try refreshing the page" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Use manual entry as backup" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Location/Tag Updates Not Saving
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Check your internet connection" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ensure you selected a valid location" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Try refreshing and updating again" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Slow Performance
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Large libraries (1000+ books) may load slowly" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Use filters to reduce displayed books" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Regular exports help with data management" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Rating or Cover Selection Not Available
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Check if you have 'can_add_books' permission for your location" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Contact your admin to grant necessary permissions" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Some features require specific user permissions" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Missing Features or Permissions
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Feature availability depends on your user role (User, Admin, Super Admin)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Some features are location-specific and require appropriate permissions" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Contact your administrator to request additional permissions" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Use 'Contact the Librarian' in the footer for feature requests" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Search />
                    <Typography variant="h6">Enhanced Filtering & Search</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Advanced Filtering Features
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Clickable Author Names
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Click any author name in book cards to instantly filter by that author" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Automatically clears other filters and focuses on the selected author" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Multi-Genre Selection
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Select multiple genres simultaneously from the filter dropdown" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Books matching ANY selected genre will be displayed (OR logic)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Visual filter chips show all active filters with color coding" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Filter Management
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Dismissible filter chips - click X to remove individual filters" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Color-coded chips: Author (blue), Shelf (gray), Genre (light blue), Location (green), Status (orange)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Clear all filters at once or remove them individually" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">⭐ Star Rating System</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Rating Your Books
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Click the star area on any book card to open the rating modal" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Rate books from 1-5 stars using the large star interface" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Add optional text reviews to share your thoughts" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Hover over stars to preview rating before clicking" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Use 'Clear Rating' to remove your rating completely" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Understanding Ratings
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Library Ratings vs Google Books Ratings
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Book cards show YOUR rating when you've rated a book" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="If you haven't rated it, shows the library average from all users" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Google Books ratings appear only in the 'More Details' modal" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Library ratings are specific to your location/library" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Text Reviews
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Add personal notes about why you rated a book" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Reviews are displayed in the 'More Details' modal" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Reviews are visible to other users in your library" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">📚 Book Cover Selection</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Choosing Different Covers
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Select covers that match your actual book editions instead of accepting the automatic selection.
                  </Typography>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    During Book Addition
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="After scanning or searching for a book, look for 'Choose Different Cover' button" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Browse up to 20 different edition covers from Google Books" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Click on your preferred cover and confirm selection" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    For Existing Books
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Use 'More Details' modal on any book card" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Look for 'Choose Different Cover' option" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Select from available covers and save changes" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Permission Requirements
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Only users with 'can_add_books' permission can change covers" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Contact your admin if the option doesn't appear" />
                    </ListItem>
                  </List>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    Cover selection automatically saves the source and date for tracking which covers were manually selected.
                  </Alert>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">🔄 Advanced Book Management</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Enhanced Duplicate Detection
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    LibraryCard uses a sophisticated three-tier system to detect duplicate books.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Exact duplicates are automatically blocked" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Potential duplicates show 'Add Anyway' option with confirmation" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Different editions with same title/author can be added separately" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Publication dates help distinguish between different editions" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Bulk Book Operations
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Selection Mode
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Toggle 'Select Multiple' mode in the Add Books section" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Select multiple books from search results" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Floating selection indicator shows count and preview" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Review all selected books together before adding" />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Bulk Review
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Set shared shelf location for all selected books" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Add bulk tags that apply to all books" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Remove individual books from selection before saving" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Save all books at once with shared settings" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">⚙️ Profile & Settings Updates</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    New Profile Structure
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    The profile dropdown now provides access to focused, single-purpose pages:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Profile" 
                        secondary="Essential user information: email, name, password management"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Locations" 
                        secondary="Location management and leave location functionality"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Checkout History" 
                        secondary="Complete history of books you've borrowed and returned"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Settings" 
                        secondary="Application preferences including dark/light mode toggle"
                      />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Dark Mode & Themes
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Access theme toggle in Settings page (not in header anymore)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Choose between light and dark modes" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Theme preference automatically saved" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Respects system preference on first visit" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">🔒 Privacy & Contact</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6" gutterBottom>
                    Privacy Controls
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Cookie consent banner on first visit" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Choose between essential cookies only or functional cookies" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Essential cookies (authentication) always enabled" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Functional cookies store preferences (theme, view mode, etc.)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Full privacy policy available at bottom of pages" />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Contact System
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="'Contact the Librarian' link in footer" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Professional contact form for support requests" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Direct email delivery to library administrators" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Include your email for responses" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              {userIsAdmin && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AdminPanelSettings />
                      <Typography variant="h6">Admin Features</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="h6" gutterBottom>
                      User Management
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Inviting Users
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Use Admin Dashboard → User Management to invite new users" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Send email invitations to specific locations" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Track invitation status and revoke pending invitations" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Manage user permissions within your assigned locations" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Permission Management
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Control user capabilities: add books, delete books, move books, create shelves, edit genres" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Bulk permission controls for multiple users" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="View-only access to permissions even without management rights" />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>
                      Book & Request Management
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Removal Requests
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Review book removal requests from users" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Approve or deny requests with optional comments" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Special handling for overdue book notifications" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Email users about overdue books or removal decisions" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Checkout Management
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Return books checked out by any user (admin override)" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="View complete checkout history for all books" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Email current book holders directly from book details" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Access checkout status filtering in library view" />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>
                      Analytics & Reporting
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Location-scoped analytics for libraries you manage" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="User activity statistics and book distribution" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Pending request summaries and notification center" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Monthly checkout reminders for overdue books" />
                      </ListItem>
                    </List>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      Admin features are location-scoped. You can only manage users and books within locations you&apos;re assigned to.
                    </Alert>
                  </AccordionDetails>
                </Accordion>
              )}

              {userIsSuperAdmin && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AdminPanelSettings sx={{ color: 'error.main' }} />
                      <Typography variant="h6">Super Admin Features</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="h6" gutterBottom>
                      Global System Administration
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Super Admins have universal access across all locations and system-wide administrative capabilities.
                    </Typography>

                    <Typography variant="subtitle1" gutterBottom>
                      User Role Management
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Promote regular admins to super admin status" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Assign and unassign admins to/from locations" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Approve signup requests from uninvited users" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Manage user roles across the entire system" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Location Management
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Create new locations across the system" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Delete existing locations and manage location owners" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Access all books and locations regardless of assignment" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Bypass location-specific permission restrictions" />
                      </ListItem>
                    </List>

                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Advanced Permission Control
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Control admin capabilities: user management, shelf management, location settings" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Manage permissions across all locations simultaneously" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Override location-scoped restrictions for troubleshooting" />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>
                      System Analytics & Monitoring
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Global system analytics across all locations" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="System-wide user activity and book statistics" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Cross-location performance monitoring" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Access to system logs and diagnostic information" />
                      </ListItem>
                    </List>

                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        ⚠️ Super Admin Responsibility
                      </Typography>
                      Super Admin privileges provide unrestricted access to all system functions. Use these capabilities responsibly and maintain the security and privacy of all users across the platform.
                    </Alert>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>

            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Export and Backup
              </Typography>
              <Typography variant="body1" gutterBottom>
                Keep your data safe by regularly exporting your library:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="1. Go to '📖 My Library'" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Look for 'Export Library' button in the library controls" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Downloads a JSON file with all your book data" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Use this for backup or data portability" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="5. Export includes book details, ratings, reviews, and location information" />
                </ListItem>
              </List>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}