import { NextRequest, NextResponse } from 'next/server'
import { requestMoMoPayment } from '@/lib/momo'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'
import { Booking } from '@/models/Booking'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, amount, phone } = await req.json()

    if (!bookingId || !amount || !phone) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify booking
    const booking = await Booking.findOne({ _id: bookingId, userId: uid })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Initiate MoMo payment
    const { momoReferenceId, externalId } = await requestMoMoPayment({
      amount,
      phone,
      referenceId: bookingId.toString(),
      note: `Triphoppa booking #${bookingId.toString().slice(-6).toUpperCase()}`,
    })

    // Create payment record
    await Payment.create({
      bookingId,
      userId: uid,
      amount,
      currency: 'EUR',
      method: 'momo',
      status: 'pending',
      momoReferenceId,
      momoPhone: phone,
    })

    return NextResponse.json({
      momoReferenceId,
      externalId,
      message: 'Payment request sent to your phone. Please approve on your MoMo app.',
    })
  } catch (err) {
    console.error('[POST /api/payments/momo]', err)
    return NextResponse.json({ error: 'Failed to initiate MoMo payment' }, { status: 500 })
  }
}