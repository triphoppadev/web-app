'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Package, Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    router.push('/')
    setUserMenuOpen(false)
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Account'

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e8d5e7] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#96298d] flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <span className="text-[#392b75] font-bold text-xl tracking-tight">
            Trip<span className="text-[#96298d]">hoppa</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-[#392b75] hover:text-[#96298d] transition-colors"
          >
            Browse Shipments
          </Link>
          <Link
            href="/traveler"
            className="text-sm font-medium text-[#392b75] hover:text-[#96298d] transition-colors"
          >
            Become a Traveler
          </Link>
          {user && (
            <Link
              href="/bookings"
              className="text-sm font-medium text-[#392b75] hover:text-[#96298d] transition-colors"
            >
              My Bookings
            </Link>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#f7f5ff] animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e8d5e7] hover:border-[#96298d] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#96298d] flex items-center justify-center text-white text-xs font-bold">
                    {displayName[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-[#392b75] hidden sm:block">
                    {displayName}
                  </span>
                  <ChevronDown size={14} className="text-[#392b75]" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#e8d5e7] shadow-lg overflow-hidden z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#392b75] hover:bg-[#f7f5ff] transition-colors"
                    >
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#392b75] hover:bg-[#f7f5ff] transition-colors"
                    >
                      <Package size={14} /> My Bookings
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#392b75] hover:bg-[#f7f5ff] transition-colors"
                    >
                      <LayoutDashboard size={14} /> Profile
                    </Link>
                    <div className="border-t border-[#e8d5e7]" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-[#392b75] hover:text-[#96298d] transition-colors px-3 py-1.5"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-[#96298d] text-white px-4 py-2 rounded-full hover:bg-[#7a1f74] transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-[#392b75]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e8d5e7] bg-white px-4 py-4 flex flex-col gap-3">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-[#392b75]"
          >
            Browse Shipments
          </Link>
          <Link
            href="/traveler"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-[#392b75]"
          >
            Become a Traveler
          </Link>
          {user && (
            <Link
              href="/bookings"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#392b75]"
            >
              My Bookings
            </Link>
          )}
          {!user && (
            <div className="flex gap-2 pt-2">
              <Link
                href="/login"
                className="flex-1 text-center text-sm font-medium border border-[#96298d] text-[#96298d] py-2 rounded-full"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center text-sm font-semibold bg-[#96298d] text-white py-2 rounded-full"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}