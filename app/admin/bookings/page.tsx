'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminGuard from '@/components/AdminGuard'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth-context'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Booking {
  _id: string
  userId: string
  userName: string
  userEmail: string
  shipmentId: {
    _id: string
    route: string
    departureDate: string
  }
  kgBooked: number
  totalPrice: number
  status: string
  paymentStatus: string
  createdAt: string
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled']
const PAYMENT_OPTIONS = ['unpaid', 'paid', 'refunded']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'bg-gray-100 text-gray-500',
  paid: 'bg-green-100 text-green-600',
  refunded: 'bg-purple-100 text-purple-600',
}

export default function AdminBookingsPage() {
  return (
    <AdminGuard>
      <BookingsContent />
    </AdminGuard>
  )
}

function BookingsContent() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { 'x-user-uid': user.uid },
      })
      const data = await res.json()
      setBookings(data.bookings ?? [])
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const updateBooking = async (
    id: string,
    status: string,
    paymentStatus: string
  ) => {
    if (!user) return
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({ status, paymentStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success('Booking updated!')
      fetchBookings()
    } catch {
      toast.error('Failed to update booking')
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
            <h1 className="text-2xl font-bold text-[#392b75]">All Bookings</h1>
            <p className="text-sm text-gray-500 mt-1">
              {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchBookings}
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
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#e8d5e7]">
            <p className="text-gray-400 text-sm">No bookings yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e8d5e7] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f7f5ff] bg-[#f7f5ff]">
                    {['Customer', 'Route', 'Date', 'Cargo', 'Total', 'Status', 'Payment', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr
                      key={b._id}
                      className={clsx(
                        'border-b border-[#f7f5ff] hover:bg-[#f7f5ff]/50 transition-colors',
                        i === bookings.length - 1 && 'border-0'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#392b75]">{b.userName}</div>
                        <div className="text-xs text-gray-400">{b.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {b.shipmentId?.route ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {b.shipmentId?.departureDate
                          ? format(new Date(b.shipmentId.departureDate), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{b.kgBooked}kg</td>
                      <td className="px-4 py-3 font-semibold text-[#96298d]">
                        ${b.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          disabled={updating === b._id}
                          onChange={e => updateBooking(b._id, e.target.value, b.paymentStatus)}
                          className={clsx(
                            'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none',
                            STATUS_COLORS[b.status]
                          )}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={b.paymentStatus}
                          disabled={updating === b._id}
                          onChange={e => updateBooking(b._id, b.status, e.target.value)}
                          className={clsx(
                            'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none',
                            PAYMENT_COLORS[b.paymentStatus]
                          )}
                        >
                          {PAYMENT_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        #{b._id.slice(-6).toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}