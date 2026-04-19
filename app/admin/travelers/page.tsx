'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminGuard from '@/components/AdminGuard'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth-context'
import { format } from 'date-fns'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface TravelerTrip {
  _id: string
  travelerId: string
  travelerName: string
  travelerEmail: string
  route: string
  departureDate: string
  availableKg: number
  remainingKg: number
  pricePerKg: number
  status: string
  verifiedByAdmin: boolean
  createdAt: string
}

export default function AdminTravelersPage() {
  return (
    <AdminGuard>
      <TravelersContent />
    </AdminGuard>
  )
}

function TravelersContent() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<TravelerTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/travelers', {
        headers: { 'x-user-uid': user.uid },
      })
      const data = await res.json()
      setTrips(data.trips ?? [])
    } catch {
      toast.error('Failed to load traveler listings')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const toggleVerify = async (id: string, currentlyVerified: boolean) => {
    if (!user) return
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/travelers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({ verifiedByAdmin: !currentlyVerified }),
      })
      if (!res.ok) throw new Error()
      toast.success(currentlyVerified ? 'Listing unverified' : 'Listing verified!')
      fetchTrips()
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f7f5ff]">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#392b75]">Traveler Listings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Verify traveler trip postings before they go live
            </p>
          </div>
          <button
            onClick={fetchTrips}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#e8d5e7] bg-white text-[#392b75] text-sm font-medium hover:border-[#96298d] transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white animate-pulse border border-[#e8d5e7]" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#e8d5e7]">
            <p className="text-gray-400 text-sm">No traveler listings yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {trips.map(trip => (
              <div
                key={trip._id}
                className="bg-white rounded-2xl border border-[#e8d5e7] p-5 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-[#392b75]">{trip.travelerName}</span>
                    <span className="text-xs text-gray-400">{trip.travelerEmail}</span>
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      trip.verifiedByAdmin
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    )}>
                      {trip.verifiedByAdmin ? 'Verified' : 'Pending review'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>{trip.route}</span>
                    <span>{format(new Date(trip.departureDate), 'MMM d, yyyy')}</span>
                    <span>{trip.availableKg}kg available</span>
                    <span>${trip.pricePerKg}/kg</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleVerify(trip._id, trip.verifiedByAdmin)}
                  disabled={updating === trip._id}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ml-4',
                    trip.verifiedByAdmin
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  )}
                >
                  {updating === trip._id ? (
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : trip.verifiedByAdmin ? (
                    <><XCircle size={14} /> Unverify</>
                  ) : (
                    <><CheckCircle size={14} /> Verify</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}