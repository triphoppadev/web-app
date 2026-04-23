import { NextRequest, NextResponse } from 'next/server'
import { getMoMoPaymentStatus } from '@/lib/momo'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'
import { Booking } from '@/models/Booking'
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
      await Payment.findOneAndUpdate(
        { momoReferenceId },
        { status: 'succeeded' }
      )
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'momo',
      })
      await Notification.create({
        userId: uid,
        title: 'MoMo payment successful!',
        message: 'Your booking has been confirmed via Mobile Money.',
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