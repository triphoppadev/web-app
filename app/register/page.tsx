'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Package, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const googleProvider = new GoogleAuthProvider()

async function syncUserToDB(uid: string, email: string, name: string, phone?: string) {
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, name, phone }),
  })
}

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      await syncUserToDB(cred.user.uid, email, name, phone)
      toast.success('Account created! Welcome to Triphoppa 🎉')
      router.push('/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        toast.error('Email already registered. Log in instead.')
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak.')
      } else {
        toast.error('Registration failed. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const { uid, email, displayName } = result.user
      await syncUserToDB(uid, email ?? '', displayName ?? 'User')
      toast.success('Account created! Welcome to Triphoppa 🎉')
      router.push('/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/popup-closed-by-user') {
        // User closed popup, do nothing
      } else {
        toast.error('Google sign-up failed. Try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5ff] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#e8d5e7] shadow-sm p-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#96298d] flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <span className="text-[#392b75] font-bold text-xl">
            Trip<span className="text-[#96298d]">hoppa</span>
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-[#392b75] mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Start shipping smarter today</p>

        {/* Google Button */}
        <button
          onClick={handleGoogleRegister}
          disabled={googleLoading}
          suppressHydrationWarning
          className="w-full flex items-center justify-center gap-3 border border-[#e8d5e7] rounded-xl py-3 text-sm font-medium text-[#392b75] hover:bg-[#f7f5ff] transition-colors mb-4 disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-[#96298d] rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#e8d5e7]" />
          <span className="text-xs text-gray-400">or sign up with email</span>
          <div className="flex-1 h-px bg-[#e8d5e7]" />
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#392b75] mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d] focus:ring-2 focus:ring-[#96298d]/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#392b75] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d] focus:ring-2 focus:ring-[#96298d]/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#392b75] mb-1.5">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+250 7xx xxx xxx"
              className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d] focus:ring-2 focus:ring-[#96298d]/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#392b75] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d] focus:ring-2 focus:ring-[#96298d]/10 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#96298d]"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#96298d] hover:bg-[#7a1f74] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create account <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          By signing up you agree to our{' '}
          <span className="text-[#96298d] cursor-pointer">Terms of Service</span>{' '}
          and{' '}
          <span className="text-[#96298d] cursor-pointer">Privacy Policy</span>.
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[#96298d] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <p className="text-xs text-gray-400 mt-6">© 2026 Triphoppa. All rights reserved.</p>
    </div>
  )
}