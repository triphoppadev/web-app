'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Loader,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type PaymentMethod = 'stripe' | 'momo'
type PaymentStep = 'select' | 'stripe-form' | 'momo-form' | 'momo-pending' | 'success'

interface PaymentModalProps {
  bookingId: string
  amount: number
  route: string
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal(props: PaymentModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentModalContent {...props} />
    </Elements>
  )
}

function PaymentModalContent({
  bookingId,
  amount,
  route,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { user } = useAuth()
  const [method, setMethod] = useState<PaymentMethod>('stripe')
  const [step, setStep] = useState<PaymentStep>('select')
  const [momoPhone, setMomoPhone] = useState('')
  const [momoReferenceId, setMomoReferenceId] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8d5e7]">
          <div>
            <h3 className="font-bold text-[#392b75]">Complete Payment</h3>
            <p className="text-xs text-gray-400">{route}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#f7f5ff] text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Amount */}
        <div className="mx-6 mt-5 p-4 rounded-2xl bg-[#f7f5ff] border border-[#e8d5e7] flex justify-between items-center mb-5">
          <span className="text-sm text-gray-500">Amount due</span>
          <span className="text-2xl font-bold text-[#96298d]">${amount.toFixed(2)}</span>
        </div>

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="px-6 pb-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-[#392b75] mb-2">Payment Successful!</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your booking has been confirmed. Check your bookings for details.
            </p>
            <button
              onClick={() => { onSuccess(); onClose() }}
              className="w-full bg-[#96298d] text-white font-semibold py-3 rounded-xl hover:bg-[#7a1f74] transition-colors"
            >
              View Bookings
            </button>
          </div>
        )}

        {/* SELECT METHOD */}
        {step === 'select' && (
          <div className="px-6 pb-6">
            <p className="text-sm font-medium text-[#392b75] mb-3">Choose payment method</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {([
                {
                  id: 'stripe' as PaymentMethod,
                  label: 'Card Payment',
                  sub: 'Visa, Mastercard, etc.',
                  icon: CreditCard,
                },
                {
                  id: 'momo' as PaymentMethod,
                  label: 'Mobile Money',
                  sub: 'MTN MoMo',
                  icon: Smartphone,
                },
              ]).map(({ id, label, sub, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                    method === id
                      ? 'border-[#96298d] bg-[#96298d]/5'
                      : 'border-[#e8d5e7] hover:border-[#96298d]/40'
                  )}
                >
                  <Icon size={22} className={method === id ? 'text-[#96298d]' : 'text-gray-400'} />
                  <span className={clsx(
                    'text-sm font-semibold',
                    method === id ? 'text-[#96298d]' : 'text-[#392b75]'
                  )}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">{sub}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(method === 'stripe' ? 'stripe-form' : 'momo-form')}
              className="w-full flex items-center justify-center gap-2 bg-[#96298d] text-white font-semibold py-3 rounded-xl hover:bg-[#7a1f74] transition-colors"
            >
              Continue <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* STRIPE FORM */}
        {step === 'stripe-form' && (
          <StripeForm
            bookingId={bookingId}
            amount={amount}
            userEmail={user?.email ?? ''}
            userId={user?.uid ?? ''}
            onBack={() => setStep('select')}
            onSuccess={() => setStep('success')}
          />
        )}

        {/* MOMO FORM */}
        {step === 'momo-form' && (
          <div className="px-6 pb-6">
            <p className="text-sm text-gray-500 mb-4">
              Enter your MTN Mobile Money number. You'll receive a payment prompt on your phone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#392b75] mb-1.5">
                MoMo phone number
              </label>
              <input
                type="tel"
                value={momoPhone}
                onChange={e => setMomoPhone(e.target.value)}
                placeholder="e.g. 250780000000"
                className="w-full px-4 py-3 rounded-xl border border-[#e8d5e7] text-[#392b75] text-sm focus:outline-none focus:border-[#96298d]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Include country code e.g. 250 for Rwanda
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-xl border border-[#e8d5e7] text-sm font-medium text-[#392b75] hover:bg-[#f7f5ff]"
              >
                Back
              </button>
              <MoMoPayButton
                bookingId={bookingId}
                amount={amount}
                phone={momoPhone}
                userId={user?.uid ?? ''}
                onPending={(refId) => {
                  setMomoReferenceId(refId)
                  setStep('momo-pending')
                }}
              />
            </div>
          </div>
        )}

        {/* MOMO PENDING */}
        {step === 'momo-pending' && (
          <div className="px-6 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <Smartphone size={28} className="text-yellow-600" />
            </div>
            <h3 className="font-bold text-[#392b75] mb-2">Check your phone</h3>
            <p className="text-sm text-gray-500 mb-6">
              A payment request of <strong>${amount.toFixed(2)}</strong> has been sent to{' '}
              <strong>{momoPhone}</strong>. Approve it on your MoMo app, then click below.
            </p>

            {/* <button
              onClick={async () => {
                if (!user) return
                setCheckingStatus(true)
                try {
                  const res = await fetch('/api/payments/momo/status', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-user-uid': user.uid,
                    },
                    body: JSON.stringify({
                      momoReferenceId,
                      bookingId,
                    }),
                  })
        
                  const data = await res.json()
                  console.log('MoMo status from API:',  data)
                  if (data.status === 'SUCCESSFUL') {
                    setStep('success')
                    toast.success('Payment confirmed!')
                  } else if (data.status === 'FAILED') {
                    toast.error('Payment failed. Please try again.')
                    setStep('momo-form')
                  } else {
                    toast('Payment still pending. Please approve on your phone.', { icon: '⏳' })
                  }
                } catch {
                  toast.error('Could not check status. Try again.')
                } finally {
                  setCheckingStatus(false)
                }
              }}
              disabled={checkingStatus}
              className="w-full flex items-center justify-center gap-2 bg-[#96298d] text-white font-semibold py-3 rounded-xl hover:bg-[#7a1f74] transition-colors disabled:opacity-60 mb-3"
            >
              {checkingStatus
                ? <><Loader size={14} className="animate-spin" /> Checking...</>
                : 'I\'ve approved the payment'
              }
            </button> */}

            <button
  onClick={async () => {
    if (!user) return
    setCheckingStatus(true)
    try {
      const res = await fetch('/api/payments/momo/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({
          momoReferenceId,
          bookingId,
        }),
      })
      const data = await res.json()

      console.log('MoMo status from API:', data)

      // Normalize status — handles SUCCESSFUL, SUCCESS, successful etc.
      const momoStatus = (data.status ?? '').toUpperCase()

      if (momoStatus === 'SUCCESSFUL' || momoStatus === 'SUCCESS') {
        setStep('success')
        toast.success('Payment confirmed!')
      } else if (momoStatus === 'FAILED') {
        toast.error('Payment failed. Please try again.')
        setStep('momo-form')
      } else if (momoStatus === 'PENDING') {
        toast('Payment still pending. Please approve on your phone.', { icon: '⏳' })
      } else {
        // Unknown — show raw for debugging
        toast(`Unexpected status: ${data.status ?? 'unknown'}. Check terminal.`, { icon: '⚠️' })
      }
    } catch {
      toast.error('Could not check status. Try again.')
    } finally {
      setCheckingStatus(false)
    }
  }}
  disabled={checkingStatus}
  className="w-full flex items-center justify-center gap-2 bg-[#96298d] text-white font-semibold py-3 rounded-xl hover:bg-[#7a1f74] transition-colors disabled:opacity-60 mb-3"
>
  {checkingStatus
    ? <><Loader size={14} className="animate-spin" /> Checking...</>
    : "I've approved the payment"
  }
</button>

            <button
              onClick={() => setStep('momo-form')}
              className="text-sm text-gray-400 hover:text-[#96298d]"
            >
              Use a different number
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stripe Form Component ────────────────────────────────────────────────────

function StripeForm({
  bookingId,
  amount,
  userEmail,
  userId,
  onBack,
  onSuccess,
}: {
  bookingId: string
  amount: number
  userEmail: string
  userId: string
  onBack: () => void
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [cardError, setCardError] = useState('')

  const handlePay = async () => {
    if (!stripe || !elements) return
    const cardEl = elements.getElement(CardElement)
    if (!cardEl) return

    setLoading(true)
    setCardError('')

    try {
      // Create PaymentIntent on server
      const res = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': userId,
        },
        body: JSON.stringify({ bookingId, amount, email: userEmail }),
      })

      if (!res.ok) throw new Error('Failed to create payment')
      const { clientSecret } = await res.json()

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: { email: userEmail },
        },
      })

      if (result.error) {
        setCardError(result.error.message ?? 'Payment failed')
      } else if (result.paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!')
        onSuccess()
      }
    } catch {
      setCardError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 pb-6">
      <p className="text-sm text-gray-500 mb-4">
        Enter your card details below. Payments are secured by Stripe.
      </p>

      <div className="mb-4 p-4 rounded-xl border border-[#e8d5e7] bg-[#f7f5ff]">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '15px',
                color: '#392b75',
                fontFamily: 'DM Sans, sans-serif',
                '::placeholder': { color: '#9ca3af' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
          onChange={e => {
            if (e.error) setCardError(e.error.message)
            else setCardError('')
          }}
        />
      </div>

      {cardError && (
        <p className="text-xs text-red-500 mb-3">{cardError}</p>
      )}

      {/* Stripe badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-4">
        <svg width="40" viewBox="0 0 60 25" fill="none">
          <path d="M10 7.5C10 6.1 11.1 5 12.5 5h35C48.9 5 50 6.1 50 7.5v10c0 1.4-1.1 2.5-2.5 2.5h-35C11.1 20 10 18.9 10 17.5v-10z" fill="#635BFF"/>
          <text x="17" y="15" fill="white" fontSize="7" fontFamily="sans-serif" fontWeight="bold">stripe</text>
        </svg>
        Secured by Stripe
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-[#e8d5e7] text-sm font-medium text-[#392b75] hover:bg-[#f7f5ff]"
        >
          Back
        </button>
        <button
          onClick={handlePay}
          disabled={loading || !stripe}
          className="flex-1 flex items-center justify-center gap-2 bg-[#96298d] text-white font-semibold py-3 rounded-xl hover:bg-[#7a1f74] transition-colors disabled:opacity-60"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <>Pay ${amount.toFixed(2)}</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── MoMo Pay Button ─────────────────────────────────────────────────────────

function MoMoPayButton({
  bookingId,
  amount,
  phone,
  userId,
  onPending,
}: {
  bookingId: string
  amount: number
  phone: string
  userId: string
  onPending: (refId: string) => void
}) {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payments/momo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': userId,
        },
        body: JSON.stringify({ bookingId, amount, phone }),
      })

      if (!res.ok) throw new Error('Failed to initiate MoMo payment')
      const data = await res.json()
      toast.success('Payment request sent to your phone!')
      onPending(data.momoReferenceId)
    } catch {
      toast.error('MoMo payment failed. Check your number and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 bg-[#f6ab2d] text-[#392b75] font-semibold py-3 rounded-xl hover:bg-[#e09a20] transition-colors disabled:opacity-60"
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-[#392b75]/30 border-t-[#392b75] rounded-full animate-spin" />
        : <>Send request <ArrowRight size={14} /></>
      }
    </button>
  )
}