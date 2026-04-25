'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  X, Package, ArrowRight, AlertTriangle,
  CreditCard, Clock, Plane, Ship,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface ShipmentForModal {
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
}

type GoodsType = 'normal' | 'special'
type FreightMode = 'air' | 'sea'

interface BookingModalProps {
  shipment: ShipmentForModal
  onClose: () => void
  onSuccess: (bookingId: string, amount: number) => void
}

export default function BookingModal({ shipment, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth()
  const router = useRouter()

  const hasSpecialGoods =
    shipment.specialGoodsPricePerKg !== undefined &&
    shipment.specialGoodsPricePerKg !== shipment.pricePerKg
  const hasSeaFreight = shipment.freightType === 'both' && !!shipment.pricePerCbm

  const [goodsType, setGoodsType] = useState<GoodsType>('normal')
  const [freightMode, setFreightMode] = useState<FreightMode>('air')
  const [kg, setKg] = useState(1)
  const [cbm, setCbm] = useState(1)
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)

  const processingFee = shipment.processingFeePerShipment ?? 19

  const effectivePricePerKg =
    goodsType === 'special' && hasSpecialGoods
      ? shipment.specialGoodsPricePerKg!
      : shipment.pricePerKg

  const cargoPrice = freightMode === 'sea'
    ? cbm * (shipment.pricePerCbm ?? 0)
    : kg * effectivePricePerKg

  const seaProcessingFee = freightMode === 'sea'
    ? (shipment.seaFreightProcessingFee ?? 0)
    : 0

  const totalPrice = cargoPrice + processingFee + seaProcessingFee
  const isAlmostFull = shipment.remainingCapacityKg <= 20
  const maxKg = Math.min(shipment.remainingCapacityKg, 500)

  const createBooking = async () => {
    if (!user) return null
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-uid': user.uid,
      },
      body: JSON.stringify({
        shipmentId: shipment._id,
        kgBooked: freightMode === 'sea' ? 0 : kg,
        cbmBooked: freightMode === 'sea' ? cbm : 0,
        freightMode,
        goodsType,
        userName: user.displayName ?? user.email?.split('@')[0],
        userEmail: user.email,
        totalPrice,
        specialInstructions: instructions,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Failed to create booking')
    }
    const data = await res.json()
    return data.booking
  }

  const handlePayNow = async () => {
    setSaving(true)
    try {
      const booking = await createBooking()
      if (!booking) return
      // Pass booking to parent to open PaymentModal
      onSuccess(booking._id, totalPrice)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLater = async () => {
    setSaving(true)
    try {
      await createBooking()
      toast.success('Booking saved! Complete payment anytime from My Bookings.')
      onClose()
      router.push('/bookings')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save booking')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8d5e7] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#96298d]/10 flex items-center justify-center">
              <Package size={16} className="text-[#96298d]" />
            </div>
            <div>
              <h3 className="font-bold text-[#392b75]">Book Cargo Space</h3>
              <p className="text-xs text-gray-400">{shipment.route}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#f7f5ff] text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Route summary */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f5ff] border border-[#e8d5e7]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#392b75]">{shipment.originCode}</div>
              <div className="text-xs text-gray-400">{shipment.route.split('\u2192')[0].trim()}</div>
            </div>
            <ArrowRight size={18} className="text-[#96298d]" />
            <div className="text-center">
              <div className="text-2xl font-bold text-[#392b75]">{shipment.destinationCode}</div>
              <div className="text-xs text-gray-400">Rwanda</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[#96298d]">
                {format(new Date(shipment.departureDate), 'MMM d')}
              </div>
              <div className="text-xs text-gray-400">${shipment.pricePerKg}/kg from</div>
            </div>
          </div>

          {/* Capacity warning */}
          {isAlmostFull && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
              <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                Only <strong>{shipment.remainingCapacityKg}kg</strong> remaining — book soon!
              </p>
            </div>
          )}

          {/* Reservation disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <Clock size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Space is only reserved after payment is confirmed.</strong> You can save this booking and pay later from My Bookings.
            </p>
          </div>

          {/* FREIGHT MODE */}
          {hasSeaFreight && (
            <div>
              <label className="block text-sm font-medium text-[#392b75] mb-2">Freight mode</label>
              <div className="grid grid-cols-2 gap-3">
                {(['air', 'sea'] as FreightMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFreightMode(mode)}
                    className={clsx(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                      freightMode === mode
                        ? 'border-[#96298d] bg-[#96298d]/5'
                        : 'border-[#e8d5e7] hover:border-[#96298d]/40'
                    )}
                  >
                    {mode === 'air'
                      ? <Plane size={20} className={freightMode === mode ? 'text-[#96298d]' : 'text-gray-400'} />
                      : <Ship size={20} className={freightMode === mode ? 'text-[#96298d]' : 'text-gray-400'} />
                    }
                    <span className={clsx(
                      'text-sm font-semibold capitalize',
                      freightMode === mode ? 'text-[#96298d]' : 'text-gray-400'
                    )}>
                      {mode} freight
                    </span>
                    <span className="text-xs text-gray-400">
                      {mode === 'air' ? `$${shipment.pricePerKg}/kg` : `$${shipment.pricePerCbm}/cbm`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GOODS TYPE */}
          {hasSpecialGoods && freightMode === 'air' && (
            <div>
              <label className="block text-sm font-medium text-[#392b75] mb-2">Goods type</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  {
                    type: 'normal' as GoodsType,
                    label: 'Normal goods',
                    price: shipment.pricePerKg,
                    desc: 'Standard items, clothing, electronics',
                  },
                  {
                    type: 'special' as GoodsType,
                    label: 'Special goods',
                    price: shipment.specialGoodsPricePerKg,
                    desc: 'Fragile, hazardous, oversized items',
                  },
                ]).map(({ type, label, price, desc }) => (
                  <button
                    key={type}
                    onClick={() => setGoodsType(type)}
                    className={clsx(
                      'flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all',
                      goodsType === type
                        ? 'border-[#96298d] bg-[#96298d]/5'
                        : 'border-[#e8d5e7] hover:border-[#96298d]/40'
                    )}
                  >
                    <span className={clsx(
                      'text-sm font-semibold',
                      goodsType === type ? 'text-[#96298d]' : 'text-[#392b75]'
                    )}>
                      {label}
                    </span>
                    <span className="text-xs font-bold text-[#f6ab2d]">${price}/kg</span>
                    <span className="text-xs text-gray-400 leading-snug">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* KG / CBM input */}
          {freightMode === 'air' ? (
            <div>
              <label className="block text-sm font-medium text-[#392b75] mb-2">
                How many kg do you need?
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setKg(Math.max(1, kg - 1))}
                  className="w-10 h-10 rounded-full border border-[#e8d5e7] text-[#392b75] font-bold hover:bg-[#f7f5ff] flex items-center justify-center text-lg"
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={maxKg}
                  value={kg}
                  onChange={e => setKg(Math.min(maxKg, Math.max(1, Number(e.target.value))))}
                  className="flex-1 text-center text-2xl font-bold text-[#392b75] border border-[#e8d5e7] rounded-xl py-2 focus:outline-none focus:border-[#96298d]"
                />
                <button
                  onClick={() => setKg(Math.min(maxKg, kg + 1))}
                  className="w-10 h-10 rounded-full border border-[#e8d5e7] text-[#392b75] font-bold hover:bg-[#f7f5ff] flex items-center justify-center text-lg"
                >+</button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">Max {maxKg}kg available</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[#392b75] mb-2">
                How many CBM do you need?
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCbm(Math.max(1, cbm - 1))}
                  className="w-10 h-10 rounded-full border border-[#e8d5e7] text-[#392b75] font-bold hover:bg-[#f7f5ff] flex items-center justify-center text-lg"
                >−</button>
                <input
                  type="number"
                  min={1}
                  value={cbm}
                  onChange={e => setCbm(Math.max(1, Number(e.target.value)))}
                  className="flex-1 text-center text-2xl font-bold text-[#392b75] border border-[#e8d5e7] rounded-xl py-2 focus:outline-none focus:border-[#96298d]"
                />
                <button
                  onClick={() => setCbm(cbm + 1)}
                  className="w-10 h-10 rounded-full border border-[#e8d5e7] text-[#392b75] font-bold hover:bg-[#f7f5ff] flex items-center justify-center text-lg"
                >+</button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">1 CBM = 1m³ of cargo space</p>
            </div>
          )}

          {/* Price breakdown */}
          <div className="rounded-2xl bg-[#f7f5ff] border border-[#e8d5e7] p-4 space-y-2">
            <p className="text-xs font-semibold text-[#392b75] uppercase tracking-wide mb-3">
              Price breakdown
            </p>
            {freightMode === 'air' ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{kg}kg × ${effectivePricePerKg}</span>
                <span className="font-medium text-[#392b75]">${(kg * effectivePricePerKg).toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{cbm} cbm × ${shipment.pricePerCbm}</span>
                  <span className="font-medium text-[#392b75]">${(cbm * (shipment.pricePerCbm ?? 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sea freight processing</span>
                  <span className="font-medium text-[#392b75]">${shipment.seaFreightProcessingFee?.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipment processing fee</span>
              <span className="font-medium text-[#392b75]">${processingFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#e8d5e7] pt-2 flex justify-between">
              <span className="font-semibold text-[#392b75]">Total</span>
              <span className="text-xl font-bold text-[#96298d]">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Special instructions */}
          <div>
            <label className="block text-sm font-medium text-[#392b75] mb-1.5">
              Special instructions{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Fragile items, special handling needs..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-sm text-[#392b75] focus:outline-none focus:border-[#96298d] resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pb-2">
            {/* Pay Now — primary */}
            <button
              onClick={handlePayNow}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#96298d] text-white font-semibold py-3.5 rounded-xl hover:bg-[#7a1f74] transition-colors disabled:opacity-60"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><CreditCard size={16} /> Pay Now — ${totalPrice.toFixed(2)}</>
              )}
            </button>

            {/* Save for Later — secondary */}
            <button
              onClick={handleSaveLater}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 border border-[#e8d5e7] text-[#392b75] font-medium py-3 rounded-xl hover:bg-[#f7f5ff] hover:border-[#96298d] transition-colors disabled:opacity-60 text-sm"
            >
              <Clock size={15} /> Save for Later
            </button>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Saving for later does not reserve your space. Space is only secured once payment is completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}