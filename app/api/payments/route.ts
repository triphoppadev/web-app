import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'

// Payment placeholder — wire up Stripe/MoMo in Phase 3
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, amount, currency = 'USD', method } = await req.json()

    if (!bookingId || !amount || !method) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    // Placeholder: create pending payment record
    const payment = await Payment.create({
      bookingId,
      userId: uid,
      amount,
      currency,
      method,
      status: 'pending',
      // stripePaymentIntentId: will be set when Stripe is integrated
      // momoReferenceId: will be set when MoMo is integrated
    })

    return NextResponse.json({
      payment,
      message: 'Payment initiated (integration pending)',
      // In production: return { clientSecret } for Stripe or { payUrl } for MoMo
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
  }
}