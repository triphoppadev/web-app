import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { Shipment } from '@/models/Shipment'
import { Notification } from '@/models/Notifications'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bookings = await Booking.find({ userId: uid })
      .populate('shipmentId')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ bookings }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/bookings]', err)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      shipmentId,
      kgBooked,
      cbmBooked,
      freightMode,
      goodsType,
      userName,
      userEmail,
      totalPrice,
      specialInstructions,
    } = await req.json()

    if (!shipmentId) {
      return NextResponse.json({ error: 'Invalid booking data' }, { status: 400 })
    }

    let shipment = null

    // Only deduct kg for air freight
    if (freightMode !== 'sea' && kgBooked > 0) {
      shipment = await Shipment.findOneAndUpdate(
        {
          _id: shipmentId,
          remainingCapacityKg: { $gte: kgBooked },
          status: 'upcoming',
        },
        { $inc: { remainingCapacityKg: -kgBooked } },
        { new: true }
      )

      if (!shipment) {
        return NextResponse.json(
          { error: 'Shipment unavailable or insufficient capacity' },
          { status: 409 }
        )
      }
    } else {
      shipment = await Shipment.findById(shipmentId)
    }

    const booking = await Booking.create({
      shipmentId,
      userId: uid,
      userEmail,
      userName,
      kgBooked: kgBooked ?? 0,
      totalPrice: totalPrice ?? 0,
      specialInstructions,
      status: 'pending',
      paymentStatus: 'unpaid',
    })

    // Create notification
    await Notification.create({
      userId: uid,
      title: 'Booking confirmed!',
      message: `Your booking for ${shipment?.route ?? 'shipment'} is pending confirmation. Total: $${totalPrice?.toFixed(2)}`,
      type: 'booking',
      link: '/bookings',
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}