'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useUser } from '@/lib/hooks/useUser'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login')
        return
      }
      if (profile && profile.role !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [user, profile, authLoading, profileLoading, router])

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#392b75] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#96298d] flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <p className="text-sm text-white/60">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') return null

  return <>{children}</>
}