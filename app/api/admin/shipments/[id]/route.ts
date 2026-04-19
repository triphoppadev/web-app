import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Shipment } from '@/models/Shipment'
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
    const shipment = await Shipment.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )
    if (!shipment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ shipment })
  } catch (err) {
    console.error('[PATCH /api/admin/shipments/[id]]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
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
    await Shipment.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/shipments/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}