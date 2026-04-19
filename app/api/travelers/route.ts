import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TravelerTrip } from '@/models/Travelertrip'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const route = searchParams.get('route')

    const query: Record<string, unknown> = { status: 'active', verifiedByAdmin: true }
    if (route) query.route = route

    const trips = await TravelerTrip.find(query)
      .sort({ departureDate: 1 })
      .lean()

    return NextResponse.json({ trips }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch traveler trips' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { route, departureDate, availableKg, pricePerKg, travelerName, travelerEmail } = await req.json()

    if (!route || !departureDate || !availableKg || !pricePerKg) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Mark user as traveler
    await User.findOneAndUpdate({ uid }, { isTraveler: true, role: 'traveler' })

    const trip = await TravelerTrip.create({
      travelerId: uid,
      travelerName,
      travelerEmail,
      route,
      departureDate: new Date(departureDate),
      availableKg,
      remainingKg: availableKg,
      pricePerKg,
    })

    return NextResponse.json({ trip }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}