import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Shipment } from '@/models/Shipment'
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
    const shipments = await Shipment.find().sort({ departureDate: 1 }).lean()
    return NextResponse.json({ shipments })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!await verifyAdmin(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await req.json()
    const shipment = await Shipment.create({ ...body, createdBy: uid })
    return NextResponse.json({ shipment }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}