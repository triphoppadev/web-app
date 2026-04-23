'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import PaymentModal from '@/components/PaymentModal'
import { useBookings, type Booking } from '@/lib/hooks/useBookings'
import { format } from 'date-fns'
import {
  Package,
  Plane,
  Calendar,
  Weight,
  RefreshCw,
  CreditCard,
} from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'

export default function BookingsPage() {
  return (
    <AuthGuard>
      <BookingsContent />
    </AuthGuard>
  )
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-500 border-red-200',
}

const PAYMENT_STYLES: Record<string, string> = {
  unpaid: 'bg-gray-100 text-gray-500',
  paid: 'bg-green-100 text-green-600',
  refunded: 'bg-purple-100 text-purple-600',
}

function BookingsContent() {
  const { bookings, loading, error, refetch } = useBookings()
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null)

  return (
    <div className="min-h-screen bg-[#f7f5ff]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#392b75]">My Bookings</h1>
            <p className="text-sm text-gray-500 mt-1">Track all your cargo shipments</p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#e8d5e7] bg-white text-[#392b75] text-sm font-medium hover:border-[#96298d] transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total bookings', value: bookings.length },
              { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length },
              { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length },
              { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-[#e8d5e7] p-4 text-center">
                <div className="text-2xl font-bold text-[#96298d]">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-white animate-pulse border border-[#e8d5e7]" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e8d5e7]">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button onClick={refetch} className="text-sm text-[#96298d] font-semibold hover:underline">
              Try again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#e8d5e7]">
            <Package size={40} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-[#392b75] mb-2">No bookings yet</h3>
            <p className="text-sm text-gray-400 mb-6">
              Browse available shipments and book your first cargo space.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[#96298d] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#7a1f74] transition-colors text-sm"
            >
              Browse Shipments
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map(booking => (
              <div
                key={booking._id}
                className="bg-white rounded-2xl border border-[#e8d5e7] p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#96298d]/10 flex items-center justify-center">
                      <Plane size={16} className="text-[#96298d]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#392b75]">
                        {booking.shipmentId?.originCode ?? '—'} → {booking.shipmentId?.destinationCode ?? 'KGL'}
                      </div>
                      <div className="text-xs text-gray-400">{booking.shipmentId?.route}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={clsx(
                      'text-xs font-semibold px-2.5 py-1 rounded-full border capitalize',
                      STATUS_STYLES[booking.status]
                    )}>
                      {booking.status}
                    </span>
                    <span className={clsx(
                      'text-xs font-medium px-2.5 py-1 rounded-full capitalize',
                      PAYMENT_STYLES[booking.paymentStatus]
                    )}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-[#f7f5ff] mb-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Weight size={13} className="text-gray-400" />
                    <div>
                      <div className="font-semibold text-[#392b75]">{booking.kgBooked}kg</div>
                      <div className="text-xs text-gray-400">Cargo weight</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar size={13} className="text-gray-400" />
                    <div>
                      <div className="font-semibold text-[#392b75]">
                        {booking.shipmentId?.departureDate
                          ? format(new Date(booking.shipmentId.departureDate), 'MMM d, yyyy')
                          : '—'}
                      </div>
                      <div className="text-xs text-gray-400">Departure</div>
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="font-bold text-[#96298d] text-lg">
                      ${booking.totalPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Booked {format(new Date(booking.createdAt), 'MMM d, yyyy · h:mm a')}
                  </span>
                  <span className="text-xs text-gray-400">
                    #{booking._id.slice(-6).toUpperCase()}
                  </span>
                </div>

                {/* Pay Now */}
                {booking.status === 'pending' && booking.paymentStatus === 'unpaid' && (
                  <div className="mt-3 pt-3 border-t border-[#f7f5ff]">
                    <button
                      onClick={() => setPayingBooking(booking)}
                      className="w-full flex items-center justify-center gap-2 bg-[#f6ab2d] hover:bg-[#e09a20] text-[#392b75] font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      <CreditCard size={14} /> Pay Now — ${booking.totalPrice.toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payingBooking && (
        <PaymentModal
          bookingId={payingBooking._id}
          amount={payingBooking.totalPrice}
          route={payingBooking.shipmentId?.route ?? 'Shipment'}
          onClose={() => setPayingBooking(null)}
          onSuccess={() => {
            setPayingBooking(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}