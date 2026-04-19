'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Package, Plane, CreditCard, Info, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

const TYPE_ICONS = {
  booking: Package,
  shipment: Plane,
  payment: CreditCard,
  system: Info,
}

const TYPE_COLORS = {
  booking: 'bg-[#96298d]/10 text-[#96298d]',
  shipment: 'bg-blue-100 text-blue-600',
  payment: 'bg-green-100 text-green-600',
  system: 'bg-gray-100 text-gray-500',
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      markAllRead()
    }
  }

  const handleNotificationClick = (link?: string) => {
    setOpen(false)
    if (link) router.push(link)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-[#392b75] hover:text-[#96298d] transition-colors rounded-full hover:bg-[#f7f5ff]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#96298d] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#e8d5e7] shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f7f5ff]">
            <span className="font-bold text-sm text-[#392b75]">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-[#96298d] hover:underline"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 rounded-xl bg-[#f7f5ff] animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = TYPE_ICONS[n.type]
                return (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n.link)}
                    className={clsx(
                      'w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f7f5ff] transition-colors text-left border-b border-[#f7f5ff] last:border-0',
                      !n.read && 'bg-[#96298d]/3'
                    )}
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      TYPE_COLORS[n.type]
                    )}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={clsx(
                          'text-sm leading-snug',
                          n.read ? 'text-gray-500' : 'font-semibold text-[#392b75]'
                        )}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#96298d] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}