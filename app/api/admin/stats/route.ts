import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Shipment } from '@/models/Shipment'
import { Booking } from '@/models/Booking'
import { TravelerTrip } from '@/models/Travelertrip'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await User.findOne({ uid })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      totalShipments,
      totalBookings,
      pendingBookings,
      totalTravelers,
      revenueData,
      kgData,
    ] = await Promise.all([
      Shipment.countDocuments({ status: 'upcoming' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      TravelerTrip.countDocuments({ status: 'active' }),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: '$kgBooked' } } }]),
    ])

    return NextResponse.json({
      totalShipments,
      totalBookings,
      pendingBookings,
      totalTravelers,
      totalRevenue: revenueData[0]?.total ?? 0,
      totalKgBooked: kgData[0]?.total ?? 0,
    })
  } catch (err) {
    console.error('[GET /api/admin/stats]', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}