'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

export interface Booking {
  _id: string
  shipmentId: {
    _id: string
    route: string
    originCode: string
    destinationCode: string
    departureDate: string
    pricePerKg: number
  }
  kgBooked: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  createdAt: string
}

export function useBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings', {
        headers: { 'x-user-uid': user.uid },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setBookings(data.bookings ?? [])
    } catch {
      setError('Could not load bookings.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/bookings', {
          headers: { 'x-user-uid': user!.uid },
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (!cancelled) setBookings(data.bookings ?? [])
      } catch {
        if (!cancelled) setError('Could not load bookings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  return { bookings, loading, error, refetch: fetchBookings }
}