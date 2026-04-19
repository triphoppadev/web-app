'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

export interface AppNotification {
  _id: string
  title: string
  message: string
  type: 'booking' | 'shipment' | 'payment' | 'system'
  read: boolean
  link?: string
  createdAt: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-uid': user.uid },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAllRead = useCallback(async () => {
    if (!user) return
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'x-user-uid': user.uid },
      })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {
      // Silent fail
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return { notifications, unreadCount, loading, fetchNotifications, markAllRead }
}