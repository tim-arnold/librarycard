'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material'
import {
  ArrowBack,
  History,
  Book,
} from '@mui/icons-material'
import Footer from '@/components/Footer'

interface CheckoutHistoryItem {
  id: number
  book_id: number
  user_id: string
  action: string // 'checkout' or 'return'
  action_date: string
  due_date: string | null
  notes: string | null
  created_at: string
  book_title: string
  book_authors: string[] // JSON parsed array
  book_isbn: string
  location_name: string
}

export default function CheckoutHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checkoutHistory, setCheckoutHistory] = useState<CheckoutHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCheckoutHistory = useCallback(async () => {
    try {
      if (!session?.user?.email) return
      
      const response = await fetch('/api/checkout-history', {
        headers: {
          'Authorization': `Bearer ${session.user.email}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const historyData = await response.json()
        setCheckoutHistory(historyData)
      }
    } catch (err) {
      console.error('Failed to load checkout history:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchCheckoutHistory()
    }
  }, [status, router, fetchCheckoutHistory])

  if (status === 'loading' || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button 
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/')}
          >
            Back to App
          </Button>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History /> Checkout History
          </Typography>
        </Box>
        
        {checkoutHistory.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
            <Typography color="text.secondary">
              No checkout history yet. Check out a book to see your reading activity here.
            </Typography>
          </Paper>
        ) : (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your complete book checkout and return activity ({checkoutHistory.length} record{checkoutHistory.length > 1 ? 's' : ''}).
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {checkoutHistory.map(item => (
                <Card key={item.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Book fontSize="small" />
                          {item.book_title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          by {Array.isArray(item.book_authors) ? item.book_authors.join(', ') : item.book_authors}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.location_name}
                        </Typography>
                        {item.book_isbn && (
                          <Typography variant="caption" color="text.secondary">
                            ISBN: {item.book_isbn}
                          </Typography>
                        )}
                        {item.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            {item.notes}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ textAlign: 'right', ml: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: item.action === 'checkout' ? 'success.main' : 'info.main',
                            fontWeight: 500,
                            textTransform: 'capitalize'
                          }}
                        >
                          {item.action === 'checkout' ? 'Checked Out' : 'Returned'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.action_date).toLocaleDateString()}
                        </Typography>
                        {item.due_date && item.action === 'checkout' && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Due: {new Date(item.due_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
      
      <Footer />
    </Container>
  )
}