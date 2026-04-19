'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminGuard from '@/components/AdminGuard'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth-context'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROUTES = [
  'USA \u2192 Rwanda',
  'Canada \u2192 Rwanda',
  'UK \u2192 Rwanda',
  'China \u2192 Rwanda',
  'Dubai \u2192 Rwanda',
]

const ORIGIN_CODES: Record<string, string> = {
  'USA \u2192 Rwanda': 'JFK',
  'Canada \u2192 Rwanda': 'YYZ',
  'UK \u2192 Rwanda': 'LHR',
  'China \u2192 Rwanda': 'PVG',
  'Dubai \u2192 Rwanda': 'DXB',
}

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
  notes?: string
}

const EMPTY_FORM = {
  route: ROUTES[0],
  departureDate: '',
  totalCapacityKg: 100,
  pricePerKg: 15,
  specialGoodsPricePerKg: '',
  pricePerCbm: '',
  seaFreightProcessingFee: '',
  processingFeePerShipment: 19,
  freightType: 'air',
  notes: '',
}

export default function AdminShipmentsPage() {
  return (
    <AdminGuard>
      <ShipmentsContent />
    </AdminGuard>
  )
}

function ShipmentsContent() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchShipments = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shipments', {
        headers: { 'x-user-uid': user.uid },
      })
      const data = await res.json()
      setShipments(data.shipments ?? [])
    } catch {
      toast.error('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  const handleSave = async () => {
    if (!user || !form.departureDate) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      const payload = {
        route: form.route,
        originCode: ORIGIN_CODES[form.route],
        destinationCode: 'KGL',
        departureDate: new Date(form.departureDate).toISOString(),
        totalCapacityKg: Number(form.totalCapacityKg),
        remainingCapacityKg: Number(form.totalCapacityKg),
        pricePerKg: Number(form.pricePerKg),
        specialGoodsPricePerKg: form.specialGoodsPricePerKg ? Number(form.specialGoodsPricePerKg) : undefined,
        pricePerCbm: form.pricePerCbm ? Number(form.pricePerCbm) : undefined,
        seaFreightProcessingFee: form.seaFreightProcessingFee ? Number(form.seaFreightProcessingFee) : undefined,
        processingFeePerShipment: Number(form.processingFeePerShipment),
        freightType: form.freightType,
        status: 'upcoming',
        notes: form.notes,
      }

      const url = editingId
        ? `/api/admin/shipments/${editingId}`
        : '/api/admin/shipments'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Save failed')
      toast.success(editingId ? 'Shipment updated!' : 'Shipment created!')
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      fetchShipments()
    } catch {
      toast.error('Failed to save shipment')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (s: Shipment) => {
    setForm({
      route: s.route,
      departureDate: format(new Date(s.departureDate), "yyyy-MM-dd'T'HH:mm"),
      totalCapacityKg: s.totalCapacityKg,
      pricePerKg: s.pricePerKg,
      specialGoodsPricePerKg: s.specialGoodsPricePerKg?.toString() ?? '',
      pricePerCbm: s.pricePerCbm?.toString() ?? '',
      seaFreightProcessingFee: s.seaFreightProcessingFee?.toString() ?? '',
      processingFeePerShipment: s.processingFeePerShipment ?? 19,
      freightType: s.freightType ?? 'air',
      notes: s.notes ?? '',
    })
    setEditingId(s._id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this shipment?')) return
    try {
      await fetch(`/api/admin/shipments/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-uid': user.uid },
      })
      toast.success('Shipment deleted')
      fetchShipments()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-500',
  }

  return (
    <div className="flex min-h-screen bg-[#f7f5ff]">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#392b75]">Shipments</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage scheduled shipments</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
            className="flex items-center gap-2 bg-[#96298d] text-white font-semibold px-4 py-2.5 rounded-full hover:bg-[#7a1f74] transition-colors text-sm"
          >
            <Plus size={16} /> New Shipment
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[#e8d5e7] p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#392b75]">
                {editingId ? 'Edit Shipment' : 'New Shipment'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Route */}
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">Route</label>
                <select
                  value={form.route}
                  onChange={e => setForm(f => ({ ...f, route: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                >
                  {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Departure */}
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">Departure Date</label>
                <input
                  type="datetime-local"
                  value={form.departureDate}
                  onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">Total Capacity (kg)</label>
                <input
                  type="number"
                  value={form.totalCapacityKg}
                  onChange={e => setForm(f => ({ ...f, totalCapacityKg: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                />
              </div>

              {/* Freight type */}
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">Freight Type</label>
                <select
                  value={form.freightType}
                  onChange={e => setForm(f => ({ ...f, freightType: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                >
                  <option value="air">Air only</option>
                  <option value="sea">Sea only</option>
                  <option value="both">Air + Sea</option>
                </select>
              </div>

              {/* Price per kg */}
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">
                  Normal goods price ($/kg)
                </label>
                <input
                  type="number"
                  value={form.pricePerKg}
                  onChange={e => setForm(f => ({ ...f, pricePerKg: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                />
              </div>

              {/* Special goods price */}
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">
                  Special goods price ($/kg) <span className="text-gray-400 font-normal">optional</span>
                </label>
                <input
                  type="number"
                  value={form.specialGoodsPricePerKg}
                  onChange={e => setForm(f => ({ ...f, specialGoodsPricePerKg: e.target.value }))}
                  placeholder="Leave blank if same as normal"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                />
              </div>

              {/* Sea freight fields */}
              {(form.freightType === 'sea' || form.freightType === 'both') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#392b75] mb-1.5">Sea price ($/cbm)</label>
                    <input
                      type="number"
                      value={form.pricePerCbm}
                      onChange={e => setForm(f => ({ ...f, pricePerCbm: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#392b75] mb-1.5">Sea processing fee ($)</label>
                    <input
                      type="number"
                      value={form.seaFreightProcessingFee}
                      onChange={e => setForm(f => ({ ...f, seaFreightProcessingFee: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                    />
                  </div>
                </>
              )}

              {/* Processing fee */}
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">Shipment processing fee ($)</label>
                <input
                  type="number"
                  value={form.processingFeePerShipment}
                  onChange={e => setForm(f => ({ ...f, processingFeePerShipment: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any additional notes for this shipment..."
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border border-[#e8d5e7] text-sm font-medium text-[#392b75] hover:bg-[#f7f5ff]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#96298d] text-white font-semibold py-3 rounded-xl hover:bg-[#7a1f74] disabled:opacity-60"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Save size={14} /> Save Shipment</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-white animate-pulse border border-[#e8d5e7]" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#e8d5e7]">
            <p className="text-gray-400 text-sm">No shipments yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e8d5e7] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f7f5ff] bg-[#f7f5ff]">
                  {['Route', 'Departure', 'Capacity', 'Rate', 'Type', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shipments.map((s, i) => (
                  <tr
                    key={s._id}
                    className={clsx(
                      'border-b border-[#f7f5ff] hover:bg-[#f7f5ff]/50 transition-colors',
                      i === shipments.length - 1 && 'border-0'
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-[#392b75]">{s.route}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {format(new Date(s.departureDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.remainingCapacityKg}/{s.totalCapacityKg}kg
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      ${s.pricePerKg}/kg
                      {s.specialGoodsPricePerKg && s.specialGoodsPricePerKg !== s.pricePerKg && (
                        <span className="text-xs text-gray-400 block">Special: ${s.specialGoodsPricePerKg}/kg</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-[#f7f5ff] text-[#392b75] capitalize">
                        {s.freightType ?? 'air'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium capitalize', STATUS_COLORS[s.status])}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-[#f7f5ff] text-gray-400 hover:text-[#96298d] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}