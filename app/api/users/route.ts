import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { uid, email, name, phone } = await req.json()

    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const role = email === adminEmail ? 'admin' : 'customer'

    const user = await User.findOneAndUpdate(
      { uid },
      { uid, email, name: name || email.split('@')[0], phone, role },
      { upsert: true, new: true }
    )

    return NextResponse.json({ user }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/users]', err)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const uid = req.headers.get('x-user-uid')
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Try to find user
    let user = await User.findOne({ uid }).lean()

    // If not found, auto-create from Firebase token data
    if (!user) {
      const email = req.headers.get('x-user-email') ?? ''
      const name = req.headers.get('x-user-name') ?? email.split('@')[0]
      const adminEmail = process.env.ADMIN_EMAIL
      const role = email === adminEmail ? 'admin' : 'customer'

      user = await User.findOneAndUpdate(
        { uid },
        { uid, email, name, role, isTraveler: false },
        { upsert: true, new: true }
      ).lean()
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}