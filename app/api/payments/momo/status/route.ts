import { NextRequest, NextResponse } from 'next/server'
import { getMoMoPaymentStatus } from '@/lib/momo'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'
import { Booking } from '@/models/Booking'
import { Shipment } from '@/models/Shipment'
import { Notification } from '@/models/Notifications'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { momoReferenceId, bookingId } = await req.json()

    if (!momoReferenceId) {
      return NextResponse.json({ error: 'Missing reference ID' }, { status: 400 })
    }

    const momoStatus = await getMoMoPaymentStatus(momoReferenceId)

    if (momoStatus.status === 'SUCCESSFUL') {
      // Update payment
      await Payment.findOneAndUpdate(
        { momoReferenceId },
        { status: 'succeeded' }
      )

      // Update booking
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentMethod: 'momo',
        },
        { new: true }
      )

      // Deduct capacity NOW
      if (booking && booking.freightMode !== 'sea' && booking.kgBooked > 0) {
        await Shipment.findByIdAndUpdate(booking.shipmentId, {
          $inc: { remainingCapacityKg: -booking.kgBooked },
        })
      }

      await Notification.create({
        userId: uid,
        title: 'MoMo payment successful! 🎉',
        message: 'Your booking is confirmed. Your cargo space is now reserved.',
        type: 'payment',
        link: '/bookings',
      })
    } else if (momoStatus.status === 'FAILED') {
      await Payment.findOneAndUpdate(
        { momoReferenceId },
        { status: 'failed' }
      )
    }

    return NextResponse.json({ status: momoStatus.status })
  } catch (err) {
    console.error('[POST /api/payments/momo/status]', err)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}