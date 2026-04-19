import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Shipment } from '@/models/Shipment'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const route = searchParams.get('route')
    const status = searchParams.get('status') ?? 'upcoming'

    const query: Record<string, unknown> = { status }
    if (route) query.route = route

    const shipments = await Shipment.find(query)
      .sort({ departureDate: 1 })
      .limit(20)
      .lean()

    return NextResponse.json({ shipments }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/shipments]', err)
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    // Verify admin via Firebase UID header (middleware handles full auth in Phase 2)
    const adminUid = req.headers.get('x-user-uid')
    if (!adminUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      route, originCode, destinationCode,
      departureDate, totalCapacityKg, pricePerKg, notes,
    } = body

    if (!route || !originCode || !departureDate || !totalCapacityKg || !pricePerKg) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const shipment = await Shipment.create({
      route,
      originCode: originCode.toUpperCase(),
      destinationCode: destinationCode?.toUpperCase() ?? 'KGL',
      departureDate: new Date(departureDate),
      totalCapacityKg: Number(totalCapacityKg),
      remainingCapacityKg: Number(totalCapacityKg),
      pricePerKg: Number(pricePerKg),
      createdBy: adminUid,
      notes,
    })

    return NextResponse.json({ shipment }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/shipments]', err)
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
  }
}