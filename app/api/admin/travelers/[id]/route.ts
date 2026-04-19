import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TravelerTrip } from '@/models/Travelertrip'
import { User } from '@/models/User'

async function verifyAdmin(uid: string | null) {
  if (!uid) return false
  const user = await User.findOne({ uid })
  return user?.role === 'admin'
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const uid = req.headers.get('x-user-uid')
    if (!await verifyAdmin(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await req.json()
    const trip = await TravelerTrip.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ trip })
  } catch (err) {
    console.error('[PATCH /api/admin/travelers/[id]]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}