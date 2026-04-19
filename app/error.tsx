'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#f7f5ff] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
        <span className="text-2xl">⚠️</span>
      </div>
      <h1 className="text-2xl font-bold text-[#392b75] mb-2">Something went wrong</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#96298d] text-white font-semibold rounded-full hover:bg-[#7a1f74] transition-colors text-sm"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-[#e8d5e7] text-[#392b75] font-semibold rounded-full hover:border-[#96298d] transition-colors text-sm"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}