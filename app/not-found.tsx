import Link from 'next/link'
import { Package } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f5ff] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#96298d] flex items-center justify-center mb-6">
        <Package size={28} className="text-white" />
      </div>
      <h1 className="text-6xl font-bold text-[#392b75] mb-2">404</h1>
      <h2 className="text-xl font-bold text-[#392b75] mb-3">Page not found</h2>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        Looks like this page got lost in transit. Let's get you back on track.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-[#96298d] text-white font-semibold rounded-full hover:bg-[#7a1f74] transition-colors text-sm"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-[#e8d5e7] text-[#392b75] font-semibold rounded-full hover:border-[#96298d] transition-colors text-sm"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}