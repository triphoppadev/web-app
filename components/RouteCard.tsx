'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Calendar, Weight, ArrowRight, Plane } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

interface RouteCardProps {
  id: string
  route: string
  originCode: string
  destinationCode: string
  departureDate: string
  totalCapacityKg: number
  remainingCapacityKg: number
  pricePerKg: number
  specialGoodsPricePerKg?: number
  pricePerCbm?: number
  freightType?: string
  processingFeePerShipment?: number
  status: string
  onBook?: () => void
}

export default function RouteCard({
  id,
  route,
  originCode,
  destinationCode,
  departureDate,
  totalCapacityKg,
  remainingCapacityKg,
  pricePerKg,
  specialGoodsPricePerKg,
  pricePerCbm,
  freightType,
  processingFeePerShipment,
  status,
  onBook,
}: RouteCardProps) {
  const { user } = useAuth()
  const router = useRouter()

  const usedKg = totalCapacityKg - remainingCapacityKg
  const fillPercent = Math.round((usedKg / totalCapacityKg) * 100)
  const isAlmostFull = fillPercent >= 80
  const isFull = remainingCapacityKg === 0

  // Pure calculation — no state needed
  const daysUntil = Math.ceil(
    (new Date(departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const handleBook = () => {
    if (onBook) {
      onBook()
      return
    }
    if (!user) {
      router.push('/login?redirect=/dashboard')
      return
    }
    router.push(`/dashboard?book=${id}`)
  }

  const handleView = () => {
    if (!user) {
      router.push('/login?redirect=/dashboard')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className={clsx(
      'bg-white rounded-2xl border transition-all duration-200 hover:shadow-md group',
      isAlmostFull ? 'border-[#f6ab2d]' : 'border-[#e8d5e7]',
      isFull && 'opacity-60'
    )}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-2xl font-bold text-[#392b75]">{originCode}</span>
              <p className="text-xs text-gray-400">{route.split('→')[0].trim()}</p>
            </div>
            <div className="flex items-center gap-1 text-[#96298d]">
              <div className="h-px w-8 bg-[#96298d]/30" />
              <Plane size={14} />
              <div className="h-px w-8 bg-[#96298d]/30" />
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#392b75]">{destinationCode}</span>
              <p className="text-xs text-gray-400">{route.split('→')[1]?.trim()}</p>
            </div>
          </div>

         <div className="flex flex-col items-end gap-1">
  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#f7f5ff] border border-[#e8d5e7]">
    <span className="text-base font-bold text-[#96298d]">${pricePerKg}</span>
    <span className="text-xs text-gray-400 ml-1">/kg</span>
  </div>
  {specialGoodsPricePerKg && specialGoodsPricePerKg !== pricePerKg && (
    <span className="text-xs text-gray-400">
      Special: <span className="font-semibold text-[#392b75]">${specialGoodsPricePerKg}/kg</span>
    </span>
  )}
  {freightType === 'both' && pricePerCbm && (
    <span className="text-xs text-gray-400">
      Sea: <span className="font-semibold text-[#392b75]">${pricePerCbm}/cbm</span>
    </span>
  )}
</div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 flex items-center gap-1">
              <Weight size={11} /> {remainingCapacityKg}kg remaining
            </span>
            {isAlmostFull && !isFull && (
              <span className="text-[#f6ab2d] font-semibold">Almost full!</span>
            )}
            {isFull && <span className="text-red-500 font-semibold">Fully booked</span>}
          </div>
          <div className="capacity-bar">
            <div className="capacity-bar-fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar size={13} />
            <span>{format(new Date(departureDate), 'MMM d, yyyy')}</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-[#f7f5ff] text-[#392b75] text-xs font-medium">
              {daysUntil > 0 ? `in ${daysUntil}d` : 'Today'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleView}
              className="text-sm text-[#96298d] font-medium hover:underline"
            >
              Details
            </button>
            <button
              onClick={handleBook}
              disabled={isFull}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#96298d] text-white hover:bg-[#7a1f74]'
              )}
            >
              Book <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}