import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'
import { Booking } from '@/models/Booking'
import { Notification } from '@/models/Notifications'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  await connectDB()
  
if (event.type === 'payment_intent.succeeded') {
  const intent = event.data.object as Stripe.PaymentIntent

  const bookingId = intent.metadata?.bookingId
  const userId = intent.metadata?.userId

  if (!bookingId || !userId) {
    console.error('Missing metadata on PaymentIntent', intent.id)
    return NextResponse.json({ received: true })
  }

  // Update payment
  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: intent.id },
    { status: 'succeeded' },
    { new: true }
  )

  if (payment) {
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'stripe',
    })

    await Notification.create({
      userId,
      title: 'Payment successful!',
      message: 'Your booking has been confirmed. We\'ll be in touch with shipment details.',
      type: 'payment',
      link: '/bookings',
    })
  }
}

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as { id: string }
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: 'failed' }
    )
  }

  return NextResponse.json({ received: true })
}