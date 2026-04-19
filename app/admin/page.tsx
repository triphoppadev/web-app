'use client'

import AdminGuard from '@/components/AdminGuard'
import AdminSidebar from '@/components/AdminSidebar'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Package, Users, Plane, TrendingUp } from 'lucide-react'

interface Stats {
  totalShipments: number
  totalBookings: number
  totalTravelers: number
  totalKgBooked: number
  pendingBookings: number
  totalRevenue: number
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  )
}

function AdminContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      if (!user) return
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'x-user-uid': user.uid },
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // Stats failed silently
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [user])

  const statCards = [
    {
      label: 'Total Shipments',
      value: stats?.totalShipments ?? 0,
      icon: Package,
      color: 'bg-[#96298d]/10 text-[#96298d]',
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Pending Bookings',
      value: stats?.pendingBookings ?? 0,
      icon: TrendingUp,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Traveler Listings',
      value: stats?.totalTravelers ?? 0,
      icon: Plane,
      color: 'bg-green-100 text-green-600',
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#f7f5ff]">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#392b75]">Admin Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back. Here's what's happening.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-white animate-pulse border border-[#e8d5e7]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#e8d5e7] p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-bold text-[#392b75]">{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Manage Shipments',
              desc: 'Create, edit and delete scheduled shipments',
              href: '/admin/shipments',
              color: 'bg-[#96298d]',
            },
            {
              title: 'View Bookings',
              desc: 'See all customer bookings and update statuses',
              href: '/admin/bookings',
              color: 'bg-[#392b75]',
            },
            {
              title: 'Traveler Listings',
              desc: 'Verify and manage traveler trip postings',
              href: '/admin/travelers',
              color: 'bg-[#f6ab2d]',
            },
          ].map(card => (
            <a
              key={card.title}
              href={card.href}
              className="bg-white rounded-2xl border border-[#e8d5e7] p-6 hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-xl ${card.color} mb-4`} />
              <h3 className="font-bold text-[#392b75] mb-1 group-hover:text-[#96298d] transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-gray-400">{card.desc}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}