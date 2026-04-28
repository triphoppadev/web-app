'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  ChevronLeft, ChevronRight, Plane,
  Calendar, Weight, ArrowRight, Clock,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import clsx from 'clsx'

interface Shipment {
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

// Route background gradients
const ROUTE_THEMES: Record<string, { from: string; to: string; city: string }> = {
  'USA':    { from: '#1a1a2e', to: '#16213e', city: 'New York' },
  'Canada': { from: '#0f3460', to: '#533483', city: 'Toronto' },
  'UK':     { from: '#1b1b2f', to: '#2c2c54', city: 'London' },
  'China':  { from: '#1a0a00', to: '#3d1a00', city: 'Shanghai' },
  'Dubai':  { from: '#0d0d1a', to: '#1a1a3e', city: 'Dubai' },
}

function getTheme(route: string) {
  const key = Object.keys(ROUTE_THEMES).find(k => route.includes(k))
  return key ? ROUTE_THEMES[key] : { from: '#392b75', to: '#96298d', city: 'Origin' }
}

function getDaysUntil(date: string) {
  return differenceInDays(new Date(date), new Date())
}

interface ShipmentCarouselProps {
  onBook: (shipment: Shipment) => void
}

export default function ShipmentCarousel({ onBook }: ShipmentCarouselProps) {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<Shipment | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef(0)
  const autoPlayRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetch('/api/shipments?status=upcoming')
      .then(r => r.json())
      .then(d => setShipments(d.shipments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const next = useCallback(() => {
    setActive(a => (a + 1) % shipments.length)
  }, [shipments.length])

  const prev = useCallback(() => {
    setActive(a => (a - 1 + shipments.length) % shipments.length)
  }, [shipments.length])

  // Autoplay
  useEffect(() => {
    if (shipments.length < 2) return
    autoPlayRef.current = setInterval(next, 4000)
    return () => clearInterval(autoPlayRef.current)
  }, [next, shipments.length])

  const pauseAutoplay = () => clearInterval(autoPlayRef.current)

  // Touch/drag support
  const onDragStart = (x: number) => {
    pauseAutoplay()
    setIsDragging(true)
    dragStart.current = x
  }

  const onDragEnd = (x: number) => {
    setIsDragging(false)
    const diff = dragStart.current - x
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev()
    }
  }

  if (loading) {
    return (
      <div className="h-56 rounded-3xl bg-white dark:bg-[#1a1728] border border-[#e8d5e7] dark:border-[#2d2547] animate-pulse" />
    )
  }

  if (shipments.length === 0) return null

  return (
    <>
      <div className="relative select-none">
        {/* Cards */}
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{ height: '220px' }}
          onMouseDown={e => onDragStart(e.clientX)}
          onMouseUp={e => onDragEnd(e.clientX)}
          onTouchStart={e => onDragStart(e.touches[0].clientX)}
          onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
        >
          {shipments.map((s, i) => {
            const theme = getTheme(s.route)
            const daysUntil = getDaysUntil(s.departureDate)
            const fillPercent = Math.round(
              ((s.totalCapacityKg - s.remainingCapacityKg) / s.totalCapacityKg) * 100
            )
            const isAlmostFull = fillPercent >= 80

            const position = i - active
            const isActive = position === 0
            const isPrev = position === -1 || position === shipments.length - 1
            const isNext = position === 1 || position === -(shipments.length - 1)

            return (
              <div
                key={s._id}
                className={clsx(
                  'absolute inset-0 rounded-3xl transition-all duration-500 ease-in-out cursor-pointer',
                  isActive && 'opacity-100 translate-x-0 scale-100 z-20',
                  isPrev && 'opacity-30 -translate-x-full scale-95 z-10',
                  isNext && 'opacity-30 translate-x-full scale-95 z-10',
                  !isActive && !isPrev && !isNext && 'opacity-0 z-0'
                )}
                onClick={() => isActive ? setExpanded(s) : (position < 0 ? prev() : next())}
              >
                {/* Background gradient */}
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
                />

                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-[#96298d]/20" />

                {/* Content */}
                <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Departs in badge */}
                      <div className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3',
                        daysUntil <= 3
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : daysUntil <= 7
                          ? 'bg-[#f6ab2d]/20 text-[#f6ab2d] border border-[#f6ab2d]/30'
                          : 'bg-white/10 text-white/80 border border-white/20'
                      )}>
                        <Clock size={10} />
                        {daysUntil <= 0 ? 'Departing today!' : `Departs in ${daysUntil}d`}
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-3xl font-bold text-white">{s.originCode}</div>
                          <div className="text-xs text-white/50">{theme.city}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-px w-6 bg-white/30" />
                          <Plane size={14} className="text-[#f6ab2d]" />
                          <div className="h-px w-6 bg-white/30" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">{s.destinationCode}</div>
                          <div className="text-xs text-white/50">Kigali</div>
                        </div>
                      </div>
                    </div>

                    {/* Price badge */}
                    <div className="text-right">
                      <div className="inline-flex flex-col items-end px-3 py-2 rounded-2xl bg-white/10 border border-white/20">
                        <span className="text-xl font-bold text-white">${s.pricePerKg}</span>
                        <span className="text-xs text-white/50">/kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="space-y-2">
                    {/* Capacity bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60 flex items-center gap-1">
                          <Weight size={10} /> {s.remainingCapacityKg}kg left
                        </span>
                        {isAlmostFull && (
                          <span className="text-[#f6ab2d] font-semibold">Almost full!</span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${fillPercent}%`,
                            background: isAlmostFull
                              ? 'linear-gradient(90deg, #f6ab2d, #ef4444)'
                              : 'linear-gradient(90deg, #96298d, #f6ab2d)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Date + CTA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <Calendar size={11} />
                        {format(new Date(s.departureDate), 'MMM d, yyyy')}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(s) }}
                        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                      >
                        View & Book <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Nav arrows */}
        {shipments.length > 1 && (
          <>
            <button
              onClick={() => { pauseAutoplay(); prev() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => { pauseAutoplay(); next() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-sm"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dots */}
        {shipments.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {shipments.map((_, i) => (
              <button
                key={i}
                onClick={() => { pauseAutoplay(); setActive(i) }}
                className={clsx(
                  'rounded-full transition-all duration-300',
                  i === active
                    ? 'w-6 h-2 bg-[#96298d]'
                    : 'w-2 h-2 bg-[#e8d5e7] dark:bg-[#2d2547]'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail / Book Modal */}
      {expanded && (
        <ShipmentDetailModal
          shipment={expanded}
          onClose={() => setExpanded(null)}
          onBook={() => {
            setExpanded(null)
            onBook(expanded)
          }}
        />
      )}
    </>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ShipmentDetailModal({
  shipment,
  onClose,
  onBook,
}: {
  shipment: Shipment
  onClose: () => void
  onBook: () => void
}) {
  const theme = getTheme(shipment.route)
  const daysUntil = getDaysUntil(shipment.departureDate)
  const fillPercent = Math.round(
    ((shipment.totalCapacityKg - shipment.remainingCapacityKg) / shipment.totalCapacityKg) * 100
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1a1728] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Hero header */}
        <div
          className="relative p-6 pb-8"
          style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-1/3 w-20 h-20 rounded-full bg-[#96298d]/20" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X size={16} />
          </button>

          {/* Departs in */}
          <div className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4',
            daysUntil <= 3
              ? 'bg-red-500/20 text-red-300 border border-red-400/30'
              : 'bg-white/10 text-white/80 border border-white/20'
          )}>
            <Clock size={10} />
            {daysUntil <= 0 ? 'Departing today!' : `Departs in ${daysUntil} days`}
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 mb-4">
            <div>
              <div className="text-4xl font-bold text-white">{shipment.originCode}</div>
              <div className="text-sm text-white/50">{theme.city}</div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-px bg-white/20" />
              <Plane size={18} className="text-[#f6ab2d]" />
              <div className="flex-1 h-px bg-white/20" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">{shipment.destinationCode}</div>
              <div className="text-sm text-white/50">Kigali, Rwanda</div>
            </div>
          </div>

          {/* Capacity bar */}
          <div>
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>{shipment.remainingCapacityKg}kg remaining</span>
              <span>{fillPercent}% booked</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${fillPercent}%`,
                  background: 'linear-gradient(90deg, #96298d, #f6ab2d)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Departure date',
                value: format(new Date(shipment.departureDate), 'MMM d, yyyy'),
              },
              {
                label: 'Total capacity',
                value: `${shipment.totalCapacityKg}kg`,
              },
              {
                label: 'Normal goods',
                value: `$${shipment.pricePerKg}/kg`,
              },
              {
                label: shipment.specialGoodsPricePerKg && shipment.specialGoodsPricePerKg !== shipment.pricePerKg
                  ? 'Special goods'
                  : 'Freight type',
                value: shipment.specialGoodsPricePerKg && shipment.specialGoodsPricePerKg !== shipment.pricePerKg
                  ? `$${shipment.specialGoodsPricePerKg}/kg`
                  : shipment.freightType ?? 'Air',
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-[#f7f5ff] dark:bg-[#2d2547]/50 rounded-2xl p-3"
              >
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</div>
                <div className="font-bold text-[#392b75] dark:text-white capitalize">{value}</div>
              </div>
            ))}
          </div>

          {/* Sea freight info */}
          {shipment.freightType === 'both' && shipment.pricePerCbm && (
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                Sea freight also available: ${shipment.pricePerCbm}/cbm
                {shipment.seaFreightProcessingFee && ` + $${shipment.seaFreightProcessingFee} processing`}
              </p>
            </div>
          )}

          {/* Processing fee note */}
          <p className="text-xs text-gray-400 text-center">
            + ${shipment.processingFeePerShipment ?? 19} shipment processing fee applies
          </p>

          {/* Space reservation disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <Clock size={13} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
              Space is only reserved after payment is confirmed. You can save your booking and pay later.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onBook}
              className="w-full flex items-center justify-center gap-2 bg-[#96298d] hover:bg-[#7a1f74] text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              <CreditCard size={16} /> Book this shipment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Need to import these inside the file
import { X, CreditCard } from 'lucide-react'