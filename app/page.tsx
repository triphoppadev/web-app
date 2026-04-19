'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import RouteCard from '@/components/RouteCard'
import BookingModal from '@/components/BookingModal'
import { useAuth } from '@/lib/auth-context'
import { useUser } from '@/lib/hooks/useUser'
import { useShipments, type Shipment } from '@/lib/hooks/useShipments'
import { Package, TrendingUp, Clock, Search } from 'lucide-react'
import Link from 'next/link'

const ROUTES = [
  'All routes',
  'USA → Rwanda',
  'Canada → Rwanda',
  'UK → Rwanda',
  'China → Rwanda',
  'Dubai → Rwanda',
]

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const { profile } = useUser()
  const [routeFilter, setRouteFilter] = useState('All routes')
  const [search, setSearch] = useState('')
  const { shipments, loading, error, refetch } = useShipments(routeFilter)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const filtered = shipments.filter(s =>
    search === '' || s.route.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f7f5ff]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Greeting */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#392b75]">
              {greeting}, {displayName} 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {profile?.role === 'admin'
                ? 'You have admin access.'
                : 'Ready to ship something today?'}
            </p>
          </div>
          <div className="flex gap-2">
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-full bg-[#392b75] text-white text-sm font-semibold hover:bg-[#2d2260] transition-colors"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/bookings"
              className="px-4 py-2 rounded-full border border-[#e8d5e7] bg-white text-[#392b75] text-sm font-semibold hover:border-[#96298d] transition-colors"
            >
              My Bookings
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Package, label: 'Active routes', value: '5', color: 'bg-[#96298d]/10 text-[#96298d]' },
            { icon: TrendingUp, label: 'Price from', value: '$8/kg', color: 'bg-[#f6ab2d]/10 text-[#f6ab2d]' },
            { icon: Clock, label: 'Delivery time', value: '7–14 days', color: 'bg-green-100 text-green-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#e8d5e7] p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="font-bold text-[#392b75]">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Hero banner for non-travelers */}
        {!profile?.isTraveler && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#392b75] to-[#96298d] text-white p-6 md:p-8 mb-8">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Earn while you fly: Become a Traveler today
              </h2>
              <p className="text-white/70 text-sm mb-4">
                Monetize your extra luggage space by helping others ship items securely.
              </p>
              <Link
                href="/traveler"
                className="inline-flex items-center gap-2 bg-[#f6ab2d] hover:bg-[#e09a20] text-[#392b75] font-bold px-5 py-2.5 rounded-full text-sm transition-colors"
              >
                Get Started →
              </Link>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10"
              style={{ background: 'radial-gradient(circle at 80% 50%, white 0%, transparent 70%)' }}
            />
          </div>
        )}

        {/* Browse Section */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#392b75]">Browse Journeys</h2>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by route..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#e8d5e7] bg-white text-[#392b75] focus:outline-none focus:border-[#96298d] transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ROUTES.map(r => (
              <button
                key={r}
                onClick={() => setRouteFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  routeFilter === r
                    ? 'bg-[#96298d] text-white'
                    : 'bg-white text-[#392b75] border border-[#e8d5e7] hover:border-[#96298d]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Shipment List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-white animate-pulse border border-[#e8d5e7]" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e8d5e7]">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button
              onClick={refetch}
              className="text-sm text-[#96298d] font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#e8d5e7]">
            <Package size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[#392b75] mb-1">No shipments found</p>
            <p className="text-sm text-gray-400">Check back soon — new routes are added regularly.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(shipment => (
              <RouteCard
                key={shipment._id}
                id={shipment._id}
                route={shipment.route}
                originCode={shipment.originCode}
                destinationCode={shipment.destinationCode}
                departureDate={shipment.departureDate}
                totalCapacityKg={shipment.totalCapacityKg}
                remainingCapacityKg={shipment.remainingCapacityKg}
                pricePerKg={shipment.pricePerKg}
                status={shipment.status}
                onBook={() => setSelectedShipment(shipment)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedShipment && (
        <BookingModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onSuccess={() => {
            setSelectedShipment(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}