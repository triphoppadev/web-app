'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Shipment {
  _id: string
  route: string
  originCode: string
  destinationCode: string
  departureDate: string
  totalCapacityKg: number
  remainingCapacityKg: number
  pricePerKg: number
  specialGoodsPricePerKg?: number
  pricePerCbm?: number
  seaFreightProcessingFee?: number
  processingFeePerShipment?: number
  freightType?: string
  status: string
}

export function useShipments(routeFilter?: string) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status: 'upcoming' })
      if (routeFilter && routeFilter !== 'All routes') {
        params.set('route', routeFilter)
      }
      const res = await fetch(`/api/shipments?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setShipments(data.shipments ?? [])
    } catch {
      setError('Could not load shipments. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [routeFilter])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ status: 'upcoming' })
        if (routeFilter && routeFilter !== 'All routes') {
          params.set('route', routeFilter)
        }
        const res = await fetch(`/api/shipments?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (!cancelled) setShipments(data.shipments ?? [])
      } catch {
        if (!cancelled) setError('Could not load shipments. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [routeFilter])

  return { shipments, loading, error, refetch: fetchShipments }
}