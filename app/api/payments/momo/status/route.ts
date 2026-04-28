import { NextRequest, NextResponse } from 'next/server'
import { getMoMoPaymentStatus } from '@/lib/momo'
import { connectDB } from '@/lib/mongodb'
import { Payment } from '@/models/Payment'
import { Booking } from '@/models/Booking'
import { Shipment } from '@/models/Shipment'
import { notifyPaymentSuccess } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { momoReferenceId, bookingId } = await req.json()

    if (!momoReferenceId) {
      return NextResponse.json({ error: 'Missing reference ID' }, { status: 400 })
    }

    console.log('[MoMo Status] Checking:', momoReferenceId)

    let momoData: { status?: string; financialTransactionId?: string } = {}
    
    try {
      momoData = await getMoMoPaymentStatus(momoReferenceId)
    } catch (err: unknown) {
      const error = err as { response?: { status: number; data: { code?: string } } }
      
      // 404 means MoMo can't find the transaction yet — treat as pending
      if (error.response?.status === 404) {
        console.log('[MoMo Status] 404 — transaction not found yet, treating as PENDING')
        return NextResponse.json({ 
          status: 'PENDING',
          message: 'Transaction not found yet. Please wait a moment and try again.'
        })
      }
      throw err
    }

    console.log('[MoMo Status] Raw response:', JSON.stringify(momoData, null, 2))

    const rawStatus = momoData?.status ?? ''
    const status = rawStatus.toUpperCase()

    console.log('[MoMo Status] Normalized status:', status)

    if (status === 'SUCCESSFUL') {
      await Payment.findOneAndUpdate(
        { momoReferenceId },
        { status: 'succeeded' }
      )

      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'momo' },
        { new: true }
      )

      if (booking) {
        if (booking.freightMode !== 'sea' && booking.kgBooked > 0) {
          await Shipment.findByIdAndUpdate(booking.shipmentId, {
            $inc: { remainingCapacityKg: -booking.kgBooked },
          })
        }

        const shipment = await Shipment.findById(booking.shipmentId)
        if (shipment) {
          await notifyPaymentSuccess({
            userId: uid,
            userEmail: booking.userEmail,
            userName: booking.userName,
            route: shipment.route,
            departureDate: shipment.departureDate.toISOString(),
            kgBooked: booking.kgBooked,
            totalPrice: booking.totalPrice,
            bookingRef: booking._id.toString().slice(-6).toUpperCase(),
            freightMode: booking.freightMode ?? 'air',
            goodsType: booking.goodsType ?? 'normal',
            paymentMethod: 'momo',
          })
        }
      }
    } else if (status === 'FAILED') {
      await Payment.findOneAndUpdate(
        { momoReferenceId },
        { status: 'failed' }
      )
    }

    return NextResponse.json({ status, raw: momoData })
  } catch (err) {
    console.error('[POST /api/payments/momo/status]', err)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}