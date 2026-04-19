'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/auth-context'
import { Plane, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ROUTES = [
  'USA \u2192 Rwanda',
  'Canada \u2192 Rwanda',
  'UK \u2192 Rwanda',
  'China \u2192 Rwanda',
  'Dubai \u2192 Rwanda',
]

export default function TravelerPage() {
  return (
    <AuthGuard>
      <TravelerContent />
    </AuthGuard>
  )
}

function TravelerContent() {
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    route: ROUTES[0],
    departureDate: '',
    availableKg: 10,
    pricePerKg: 10,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.departureDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/travelers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({
          ...form,
          travelerName: user.displayName ?? user.email?.split('@')[0],
          travelerEmail: user.email,
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
      toast.success('Trip posted! Pending admin verification.')
    } catch {
      toast.error('Failed to post trip. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f7f5ff]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#392b75] mb-2">Trip Posted!</h2>
          <p className="text-gray-500 mb-6">
            Your listing is pending admin verification. Once approved it will be visible to customers.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-[#96298d] font-semibold hover:underline"
          >
            Post another trip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f5ff]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Hero */}
        <div className="bg-gradient-to-r from-[#392b75] to-[#96298d] rounded-3xl p-8 text-white mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Plane size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Become a Traveler</h1>
          <p className="text-white/70 text-sm">
            Flying to Rwanda? Monetize your extra luggage space by carrying
            cargo for our customers. You set the price — we handle the matching.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { step: '1', title: 'Post your trip', desc: 'Share your route, date and available kg' },
            { step: '2', title: 'Get verified', desc: 'Our team reviews and approves your listing' },
            { step: '3', title: 'Earn money', desc: 'Customers book your space and you get paid' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl border border-[#e8d5e7] p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#96298d] text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">
                {step}
              </div>
              <div className="text-sm font-bold text-[#392b75] mb-1">{title}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-[#e8d5e7] p-6">
          <h2 className="font-bold text-[#392b75] mb-5">Post your trip</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-[#392b75] mb-1.5">Departure date</label>
              <input
                type="date"
                required
                value={form.departureDate}
                onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">
                  Available kg
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={form.availableKg}
                  onChange={e => setForm(f => ({ ...f, availableKg: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#392b75] mb-1.5">
                  Your price ($/kg)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.pricePerKg}
                  onChange={e => setForm(f => ({ ...f, pricePerKg: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#96298d] text-white font-semibold py-3 rounded-xl hover:bg-[#7a1f74] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Post my trip <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}