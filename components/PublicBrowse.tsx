'use client'

import { useState } from 'react'
import RouteCard from './RouteCard'
import { Search } from 'lucide-react'

const ROUTES = [
  'All routes',
  'USA → Rwanda',
  'Canada → Rwanda',
  'UK → Rwanda',
  'China → Rwanda',
  'Dubai → Rwanda',
]

interface Shipment {
  _id: string
  route: string
  originCode: string
  destinationCode: string
  departureDate: string
  totalCapacityKg: number
  remainingCapacityKg: number
  pricePerKg: number
  status: string
}

export default function PublicBrowse({ initialShipments }: { initialShipments: Shipment[] }) {
  const [filter, setFilter] = useState('All routes')
  const [search, setSearch] = useState('')

  const filtered = initialShipments.filter(s => {
    const matchRoute = filter === 'All routes' || s.route === filter
    const matchSearch = search === '' || s.route.toLowerCase().includes(search.toLowerCase())
    return matchRoute && matchSearch
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#e8d5e7] text-[#392b75] focus:outline-none focus:border-[#96298d] transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROUTES.map(r => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === r
                  ? 'bg-[#96298d] text-white'
                  : 'bg-[#f7f5ff] text-[#392b75] border border-[#e8d5e7] hover:border-[#96298d]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-display font-semibold mb-2">No shipments found</p>
          <p className="text-sm">Check back soon — new routes are added regularly.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(s => (
            <RouteCard
              key={s._id}
              id={s._id}
              route={s.route}
              originCode={s.originCode}
              destinationCode={s.destinationCode}
              departureDate={s.departureDate}
              totalCapacityKg={s.totalCapacityKg}
              remainingCapacityKg={s.remainingCapacityKg}
              pricePerKg={s.pricePerKg}
              status={s.status}
            />
          ))}
        </div>
      )}

      {/* Auth nudge */}
      <div className="mt-8 p-5 rounded-2xl bg-[#f7f5ff] border border-[#e8d5e7] text-center">
        <p className="text-sm text-[#392b75]">
          Ready to ship?{' '}
          <a href="/register" className="text-[#96298d] font-semibold hover:underline">
            Create a free account
          </a>{' '}
          to book cargo space instantly.
        </p>
      </div>
    </div>
  )
}