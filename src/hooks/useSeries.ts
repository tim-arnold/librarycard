'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Series, CreateSeriesRequest, UpdateSeriesRequest } from '@/lib/types'
import { 
  getUserSeries, 
  createSeries as createSeriesAPI, 
  updateSeries as updateSeriesAPI, 
  deleteSeries as deleteSeriesAPI,
  addBooksToSeries as addBooksToSeriesAPI,
  removeBookFromSeries as removeBookFromSeriesAPI 
} from '@/lib/api'

interface UseSeriesReturn {
  series: Series[]
  isLoading: boolean
  error: string | null
  createSeries: (seriesData: CreateSeriesRequest) => Promise<Series | null>
  updateSeries: (seriesId: string, updates: UpdateSeriesRequest) => Promise<Series | null>
  deleteSeries: (seriesId: string) => Promise<boolean>
  addBooksToSeries: (seriesId: string, bookIds: string[]) => Promise<{ added: number, skipped: number } | null>
  removeBookFromSeries: (seriesId: string, bookId: string) => Promise<boolean>
  refreshSeries: () => Promise<void>
}

export function useSeries(locationId?: number): UseSeriesReturn {
  const [series, setSeries] = useState<Series[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSeries = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getUserSeries(locationId)
      setSeries(response.series)
    } catch (err) {
      console.error('Failed to fetch series:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch series')
      setSeries([])
    } finally {
      setIsLoading(false)
    }
  }, [locationId])

  const createSeries = useCallback(async (seriesData: CreateSeriesRequest): Promise<Series | null> => {
    try {
      setError(null)
      const newSeries = await createSeriesAPI(seriesData)
      setSeries(prev => [...prev, newSeries])
      return newSeries
    } catch (err) {
      console.error('Failed to create series:', err)
      setError(err instanceof Error ? err.message : 'Failed to create series')
      return null
    }
  }, [])

  const updateSeries = useCallback(async (seriesId: string, updates: UpdateSeriesRequest): Promise<Series | null> => {
    try {
      setError(null)
      const updatedSeries = await updateSeriesAPI(seriesId, updates)
      setSeries(prev => prev.map(s => s.id === seriesId ? updatedSeries : s))
      return updatedSeries
    } catch (err) {
      console.error('Failed to update series:', err)
      setError(err instanceof Error ? err.message : 'Failed to update series')
      return null
    }
  }, [])

  const deleteSeries = useCallback(async (seriesId: string): Promise<boolean> => {
    try {
      setError(null)
      await deleteSeriesAPI(seriesId)
      setSeries(prev => prev.filter(s => s.id !== seriesId))
      return true
    } catch (err) {
      console.error('Failed to delete series:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete series')
      return false
    }
  }, [])

  const addBooksToSeries = useCallback(async (seriesId: string, bookIds: string[]): Promise<{ added: number, skipped: number } | null> => {
    try {
      setError(null)
      const result = await addBooksToSeriesAPI(seriesId, bookIds)
      
      // Update the book count for the series
      setSeries(prev => prev.map(s => 
        s.id === seriesId 
          ? { ...s, book_count: (s.book_count || 0) + result.added_books.length }
          : s
      ))
      
      return { added: result.added_books.length, skipped: result.skipped }
    } catch (err) {
      console.error('Failed to add books to series:', err)
      setError(err instanceof Error ? err.message : 'Failed to add books to series')
      return null
    }
  }, [])

  const removeBookFromSeries = useCallback(async (seriesId: string, bookId: string): Promise<boolean> => {
    try {
      setError(null)
      await removeBookFromSeriesAPI(seriesId, bookId)
      
      // Update the book count for the series
      setSeries(prev => prev.map(s => 
        s.id === seriesId 
          ? { ...s, book_count: Math.max(0, (s.book_count || 0) - 1) }
          : s
      ))
      
      return true
    } catch (err) {
      console.error('Failed to remove book from series:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove book from series')
      return false
    }
  }, [])

  const refreshSeries = useCallback(async () => {
    await fetchSeries()
  }, [fetchSeries])

  useEffect(() => {
    fetchSeries()
  }, [fetchSeries])

  return {
    series,
    isLoading,
    error,
    createSeries,
    updateSeries,
    deleteSeries,
    addBooksToSeries,
    removeBookFromSeries,
    refreshSeries
  }
}