import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { User } from '@/models/User'

async function verifyAdmin(uid: string | null) {
  if (!uid) return false
  const user = await User.findOne({ uid })
  return user?.role === 'admin'
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!await verifyAdmin(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const bookings = await Booking.find()
      .populate('shipmentId')
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json({ bookings })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}