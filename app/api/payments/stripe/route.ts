import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'
import { Booking } from '@/models/Booking'
import { Shipment } from '@/models/Shipment'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, amount, currency = 'usd', email } = await req.json()

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const booking = await Booking.findOne({ _id: bookingId, userId: uid })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check capacity is still available before charging
    if (booking.freightMode !== 'sea' && booking.kgBooked > 0) {
      const shipment = await Shipment.findById(booking.shipmentId)
      if (!shipment || shipment.remainingCapacityKg < booking.kgBooked) {
        return NextResponse.json(
          { error: 'Sorry, this shipment no longer has enough capacity. Please book a different shipment.' },
          { status: 409 }
        )
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        bookingId: bookingId.toString(),
        userId: uid,
        kgBooked: booking.kgBooked.toString(),
        shipmentId: booking.shipmentId.toString(),
        freightMode: booking.freightMode ?? 'air',
      },
      receipt_email: email,
      description: `Triphoppa cargo booking #${bookingId.toString().slice(-6).toUpperCase()}`,
    })

    await Payment.create({
      bookingId,
      userId: uid,
      amount,
      currency: currency.toUpperCase(),
      method: 'stripe',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (err) {
    console.error('[POST /api/payments/stripe]', err)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}