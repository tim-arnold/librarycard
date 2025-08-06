'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import type { EnhancedBook, CuratedGenre } from '@/lib/types'
import { updateBook, deleteBook as deleteBookAPI } from '@/lib/api'
import { getApiBaseUrl } from '@/lib/apiConfig'

async function getCSRFToken(userEmail: string): Promise<string | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/csrf-token`, {
      headers: {
        'Authorization': `Bearer ${userEmail}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.csrfToken
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
  }
  return null
}

async function getAuthHeaders(userEmail: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${userEmail}`,
    'Content-Type': 'application/json',
  }
  
  // Add CSRF token for state-changing operations
  const csrfToken = await getCSRFToken(userEmail)
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }
  
  return headers
}

interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
}

interface UseBookActionsProps {
  books: EnhancedBook[]
  setBooks: (books: EnhancedBook[]) => void
  shelves: Shelf[]
  pendingRemovalRequests: Record<string, number>
  setPendingRemovalRequests: (requests: Record<string, number>) => void
  loadPendingRemovalRequests: () => Promise<void>
  currentUserId: string | null
  confirmAsync: (options: any, action: () => Promise<void>) => Promise<boolean>
  alert: (options: any) => Promise<void>
}

export function useBookActions({
  books,
  setBooks,
  shelves,
  pendingRemovalRequests,
  setPendingRemovalRequests,
  loadPendingRemovalRequests,
  currentUserId,
  confirmAsync,
  alert
}: UseBookActionsProps) {
  const { data: session } = useSession()
  
  // Modal states
  const [showRemovalReasonModal, setShowRemovalReasonModal] = useState(false)
  const [removalReasonCallback, setRemovalReasonCallback] = useState<((result: { value: string; label: string; details?: string } | null) => void) | null>(null)
  
  // Animation states
  const [animatingCovers, setAnimatingCovers] = useState<Set<string>>(new Set())

  const deleteBook = async (bookId: string, bookTitle: string) => {
    const confirmed = await confirmAsync(
      {
        title: 'Remove Book',
        message: `Are you sure you want to remove "${bookTitle}" from your library? This action cannot be undone.`,
        confirmText: 'Remove Book',
        variant: 'error'
      },
      async () => {
        const success = await deleteBookAPI(bookId)
        if (success) {
          const updatedBooks = books.filter(book => book.id !== bookId)
          setBooks(updatedBooks)
          await alert({
            title: 'Book Removed',
            message: `"${bookTitle}" has been successfully removed from your library.`,
            variant: 'success'
          })
        } else {
          throw new Error('Failed to remove book')
        }
      }
    )

    if (!confirmed) {
      await alert({
        title: 'Remove Failed',
        message: 'Failed to remove the book. Please try again.',
        variant: 'error'
      })
    }
  }

  const cancelRemovalRequest = async (bookId: string, bookTitle: string) => {
    if (!session?.user?.email) return

    const requestId = pendingRemovalRequests[bookId]
    if (!requestId) return

    const confirmed = await confirmAsync(
      {
        title: 'Cancel Removal Request',
        message: `Cancel your removal request for "${bookTitle}"?`,
        confirmText: 'Cancel Request',
        variant: 'warning'
      },
      async () => {
        try {
          const headers = await getAuthHeaders(session.user.email!)
          const response = await fetch(`${getApiBaseUrl()}/api/book-removal-requests/${requestId}`, {
            method: 'DELETE',
            headers,
          })

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              try {
                const errorText = await response.text()
                errorMessage = errorText || errorMessage
              } catch {
                errorMessage = `Request failed with status ${response.status}`
              }
            }
            throw new Error(errorMessage)
          }

          const result = await response.json()
          
          // Remove from pending requests map
          const updatedPendingRequests = { ...pendingRemovalRequests }
          delete updatedPendingRequests[bookId]
          setPendingRemovalRequests(updatedPendingRequests)
          
          await alert({
            title: 'Request Cancelled',
            message: `Your removal request for "${bookTitle}" has been cancelled.`,
            variant: 'success'
          })
        } catch (error) {
          console.error('Error cancelling removal request:', error)
          await alert({
            title: 'Cancel Failed',
            message: error instanceof Error ? error.message : 'Failed to cancel removal request. Please try again.',
            variant: 'error'
          })
        }
      }
    )

    if (!confirmed) {
      return
    }
  }

  const requestBookRemoval = async (bookId: string, bookTitle: string) => {
    if (!session?.user?.email) return

    // First, ask user to select a reason
    const reason = await selectRemovalReason()
    if (!reason) return // User cancelled reason selection

    const confirmed = await confirmAsync(
      {
        title: 'Request Book Removal',
        message: `Submit a request to remove "${bookTitle}" from the library?\n\nReason: ${reason.label}${reason.details ? `\nDetails: ${reason.details}` : ''}\n\nAn administrator will review your request.`,
        confirmText: 'Submit Request',
        variant: 'warning'
      },
      async () => {
        try {
          const headers = await getAuthHeaders(session.user.email!)
          const response = await fetch(`${getApiBaseUrl()}/api/book-removal-requests`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              book_id: parseInt(bookId),
              reason: reason.value,
              reason_details: reason.details || null
            })
          })

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              try {
                const errorText = await response.text()
                errorMessage = errorText || errorMessage
              } catch {
                errorMessage = `Request failed with status ${response.status}`
              }
            }
            throw new Error(errorMessage)
          }

          const result = await response.json()
          
          // Refresh pending removal requests after successful submission
          await loadPendingRemovalRequests()
          
          await alert({
            title: 'Removal Request Submitted',
            message: `Your request to remove "${bookTitle}" has been submitted to the administrator for review. Request ID: ${result.id}`,
            variant: 'success'
          })
        } catch (error) {
          console.error('Error submitting removal request:', error)
          await alert({
            title: 'Request Failed',
            message: error instanceof Error ? error.message : 'Failed to submit removal request. Please try again.',
            variant: 'error'
          })
        }
      }
    )

    if (!confirmed) {
      return
    }
  }

  const selectRemovalReason = async (): Promise<{ value: string; label: string; details?: string } | null> => {
    return new Promise((resolve) => {
      setRemovalReasonCallback(() => resolve)
      setShowRemovalReasonModal(true)
    })
  }

  const handleRemovalReasonModalClose = (result: { value: string; label: string; details?: string } | null) => {
    setShowRemovalReasonModal(false)
    if (removalReasonCallback) {
      removalReasonCallback(result)
      setRemovalReasonCallback(null)
    }
  }

  const updateBookShelf = async (bookId: string, newShelfId: number, shelfName?: string) => {
    const success = await updateBook(bookId, { shelf_id: newShelfId })
    if (success) {
      const resolvedShelfName = shelfName || shelves.find(s => s.id === newShelfId)?.name || ''
      const updatedBooks = books.map(book =>
        book.id === bookId ? { ...book, shelf_id: newShelfId, shelf_name: resolvedShelfName } : book
      )
      setBooks(updatedBooks)
    }
  }

  const checkoutBook = async (bookId: string, bookTitle: string) => {
    if (!session?.user?.email) return

    const confirmed = await confirmAsync(
      {
        title: 'Check Out Book',
        message: `Check out "${bookTitle}"? You'll be marked as the current reader.`,
        confirmText: 'Check Out',
        variant: 'info'
      },
      async () => {
        try {
          const headers = await getAuthHeaders(session.user.email!)
          const response = await fetch(`${getApiBaseUrl()}/api/books/${bookId}/checkout`, {
            method: 'POST',
            headers,
          })

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              try {
                const errorText = await response.text()
                errorMessage = errorText || errorMessage
              } catch {
                errorMessage = `Request failed with status ${response.status}`
              }
            }
            throw new Error(errorMessage)
          }

          const result = await response.json()
          
          // Update local state
          const updatedBooks = books.map(book => 
            book.id === bookId 
              ? { 
                  ...book, 
                  status: 'checked_out',
                  checked_out_by: result.checked_out_by,
                  checked_out_by_name: result.checked_out_by_name,
                  checked_out_date: result.checked_out_date
                }
              : book
          )
          setBooks(updatedBooks)
          
          await alert({
            title: 'Book Checked Out',
            message: `"${bookTitle}" has been checked out to you.`,
            variant: 'success'
          })
        } catch (error) {
          console.error('Error checking out book:', error)
          await alert({
            title: 'Checkout Failed',
            message: error instanceof Error ? error.message : 'Failed to check out book. Please try again.',
            variant: 'error'
          })
        }
      }
    )

    if (!confirmed) {
      return
    }
  }

  const checkinBook = async (bookId: string, bookTitle: string) => {
    if (!session?.user?.email) return

    // Find the book to check who checked it out
    const book = books.find(b => b.id === bookId)
    const isReturningSomeoneElsesBook = book?.checked_out_by && book.checked_out_by !== currentUserId

    const message = isReturningSomeoneElsesBook 
      ? `Return "${bookTitle}" even though it was checked out by another person? This will mark the book as available and you will be able to immediately check it out.`
      : `Return "${bookTitle}"? This will mark the book as available.`

    const confirmed = await confirmAsync(
      {
        title: 'Return Book',
        message,
        confirmText: 'Return Book',
        variant: 'info'
      },
      async () => {
        try {
          const headers = await getAuthHeaders(session.user.email!)
          const response = await fetch(`${getApiBaseUrl()}/api/books/${bookId}/checkin`, {
            method: 'POST',
            headers,
          })

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              try {
                const errorText = await response.text()
                errorMessage = errorText || errorMessage
              } catch {
                errorMessage = `Request failed with status ${response.status}`
              }
            }
            throw new Error(errorMessage)
          }

          const result = await response.json()
          
          // Update local state
          const updatedBooks = books.map(book => 
            book.id === bookId 
              ? { 
                  ...book, 
                  status: 'available',
                  checked_out_by: undefined,
                  checked_out_by_name: undefined,
                  checked_out_date: undefined
                }
              : book
          )
          setBooks(updatedBooks)
          
          await alert({
            title: 'Book Returned',
            message: `"${bookTitle}" has been returned and is now available.`,
            variant: 'success'
          })
        } catch (error) {
          console.error('Error returning book:', error)
          await alert({
            title: 'Return Failed',
            message: error instanceof Error ? error.message : 'Failed to return book. Please try again.',
            variant: 'error'
          })
        }
      }
    )

    if (!confirmed) {
      return
    }
  }

  const handleRatingSubmit = async (bookId: string, rating: number, reviewText?: string) => {
    if (!session?.user?.email) return

    try {
      const headers = await getAuthHeaders(session.user.email!)
      const response = await fetch(`${getApiBaseUrl()}/api/books/${bookId}/rate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          reviewText: reviewText || null
        })
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          try {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          } catch {
            errorMessage = `Request failed with status ${response.status}`
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Update local state with new rating data
      const updatedBooks = books.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              userRating: rating === 0 ? null : rating,
              userReview: rating === 0 ? null : (reviewText || null),
              averageRating: result.averageRating,
              ratingCount: result.ratingCount
            }
          : book
      )
      setBooks(updatedBooks)
    } catch (error) {
      console.error('Error submitting rating:', error)
      throw error // Re-throw to let caller handle the error display
    }
  }

  const handleGenreUpdate = async (bookId: string, genres: CuratedGenre[]) => {
    if (!session?.user?.email) return

    try {
      const headers = await getAuthHeaders(session.user.email)
      const response = await fetch(`${getApiBaseUrl()}/api/books/${bookId}/genres`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ genres }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Update local state
      const updatedBooks = books.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            assignedGenres: genres
          }
        }
        return book
      })
      setBooks(updatedBooks)
    } catch (error) {
      console.error('Error updating genres:', error)
      throw error
    }
  }

  const handleCoverSelect = async (bookId: string, coverOption: any) => {
    try {
      const coverUrl = coverOption.covers.medium || coverOption.covers.small || coverOption.covers.thumbnail
      
      // Note: Animation should already be started by the parent component for immediate feedback
      
      const success = await updateBook(bookId, {
        thumbnail: coverUrl,
        alternative_covers: [coverOption],
        selected_cover_source: {
          source: 'google_books',
          url: coverUrl,
          selectedAt: new Date().toISOString(),
          selectedBy: session?.user?.email || 'unknown',
          google_id: coverOption.id,
          selection_reason: 'user_selected'
        }
      })

      if (success) {
        // Update the book in local state with new cover
        const updatedBooks = books.map(book => 
          book.id === bookId 
            ? { ...book, thumbnail: coverUrl }
            : book
        )
        setBooks(updatedBooks)
        
        return true
      } else {
        // Stop animation on failure
        setAnimatingCovers(prev => {
          const newSet = new Set(prev)
          newSet.delete(bookId)
          return newSet
        })
        
        await alert({
          title: 'Update Failed',
          message: 'Failed to update book cover. Please try again.',
          variant: 'error'
        })
        return false
      }
    } catch (error) {
      // Stop animation on error
      setAnimatingCovers(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
      
      console.error('Error updating book cover:', error)
      await alert({
        title: 'Update Failed',
        message: 'Failed to update book cover. Please try again.',
        variant: 'error'
      })
      return false
    }
  }

  const handleCoverAnimationComplete = (bookId: string) => {
    setAnimatingCovers(prev => {
      const newSet = new Set(prev)
      newSet.delete(bookId)
      return newSet
    })
  }

  const startCoverAnimation = (bookId: string) => {
    setAnimatingCovers(prev => new Set(Array.from(prev).concat(bookId)))
  }

  return {
    // Actions
    deleteBook,
    cancelRemovalRequest,
    requestBookRemoval,
    updateBookShelf,
    checkoutBook,
    checkinBook,
    handleRatingSubmit,
    handleGenreUpdate,
    handleCoverSelect,
    
    // Animation states
    animatingCovers,
    handleCoverAnimationComplete,
    startCoverAnimation,
    
    // Modal states
    showRemovalReasonModal,
    handleRemovalReasonModalClose,
  }
}