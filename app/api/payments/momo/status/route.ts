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

    const { momoReferenceId, bookingId, sandboxOverride } = await req.json()

    if (!momoReferenceId) {
      return NextResponse.json({ error: 'Missing reference ID' }, { status: 400 })
    }

    const isSandbox = process.env.MOMO_TARGET_ENVIRONMENT === 'sandbox'

    console.log('[MoMo Status] Checking:', momoReferenceId, '| sandbox:', isSandbox)

    // ── Sandbox bypass ──────────────────────────────────────────────────────
    // In sandbox, MoMo doesn't persist transactions for status checks.
    // sandboxOverride lets us manually simulate SUCCESSFUL or FAILED for testing.
    // This code path is NEVER hit in production (MOMO_TARGET_ENVIRONMENT !== sandbox)
    if (isSandbox && sandboxOverride) {
      const overrideStatus = sandboxOverride.toUpperCase()
      console.log('[MoMo Status] Sandbox override applied:', overrideStatus)

      if (overrideStatus === 'SUCCESSFUL') {
        await confirmPayment({ momoReferenceId, bookingId, uid })
      } else if (overrideStatus === 'FAILED') {
        await Payment.findOneAndUpdate({ momoReferenceId }, { status: 'failed' })
      }

      return NextResponse.json({ status: overrideStatus, sandboxMode: true })
    }
    // ────────────────────────────────────────────────────────────────────────

    let momoData: { status?: string } = {}

    try {
      momoData = await getMoMoPaymentStatus(momoReferenceId)
    } catch (err: unknown) {
      const error = err as { response?: { status: number } }
      if (error.response?.status === 404) {
        console.log('[MoMo Status] 404 — treating as PENDING')
        return NextResponse.json({
          status: 'PENDING',
          message: 'Transaction not found. Please wait and try again.',
        })
      }
      throw err
    }

    console.log('[MoMo Status] Raw:', JSON.stringify(momoData, null, 2))

    const status = (momoData?.status ?? '').toUpperCase()

    if (status === 'SUCCESSFUL') {
      await confirmPayment({ momoReferenceId, bookingId, uid })
    } else if (status === 'FAILED') {
      await Payment.findOneAndUpdate({ momoReferenceId }, { status: 'failed' })
    }

    return NextResponse.json({ status, raw: momoData })
  } catch (err) {
    console.error('[POST /api/payments/momo/status]', err)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}

// ─── Shared confirmation logic ────────────────────────────────────────────────
async function confirmPayment({
  momoReferenceId,
  bookingId,
  uid,
}: {
  momoReferenceId: string
  bookingId: string
  uid: string
}) {
  await Payment.findOneAndUpdate({ momoReferenceId }, { status: 'succeeded' })

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
}