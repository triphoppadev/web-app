'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export interface UserProfile {
  uid: string
  email: string
  name: string
  phone?: string
  role: 'customer' | 'traveler' | 'admin'
  isTraveler: boolean
}

export function useUser() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!user) {
        if (!cancelled) {
          setProfile(null)
          setLoading(false)
        }
        return
      }
      try {
        const res = await fetch('/api/users', {
          headers: {
            'x-user-uid': user.uid,
            'x-user-email': user.email ?? '',
            'x-user-name': user.displayName ?? user.email?.split('@')[0] ?? '',
          },
        })
        const data = await res.json()
        if (!cancelled) setProfile(data.user ?? null)
      } catch {
        if (!cancelled) setProfile(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => { cancelled = true }
  }, [user])

  return { profile, loading }
}