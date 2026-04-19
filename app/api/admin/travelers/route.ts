import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TravelerTrip } from '@/models/Travelertrip'
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
    const trips = await TravelerTrip.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json({ trips })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}