import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'
import { Booking } from '@/models/Booking'
import { Shipment } from '@/models/Shipment'
import { Notification } from '@/models/Notifications'

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
    const intent = event.data.object as unknown as {
      id: string
      metadata: {
        bookingId: string
        userId: string
        kgBooked: string
        shipmentId: string
        freightMode: string
      }
    }

    const { bookingId, userId, kgBooked, shipmentId, freightMode } = intent.metadata

    // Update payment record
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: 'succeeded' }
    )

    // Update booking to confirmed + paid
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'stripe',
    })

    // NOW deduct capacity from shipment
    if (freightMode !== 'sea' && Number(kgBooked) > 0) {
      await Shipment.findByIdAndUpdate(shipmentId, {
        $inc: { remainingCapacityKg: -Number(kgBooked) },
      })
    }

    // Notify user
    await Notification.create({
      userId,
      title: 'Payment successful! 🎉',
      message: 'Your booking is confirmed. Your cargo space is now reserved.',
      type: 'payment',
      link: '/bookings',
    })
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