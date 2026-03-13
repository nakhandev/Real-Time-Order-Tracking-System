import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET locations (filter by orderId or driverId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const driverId = searchParams.get('driverId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    
    if (orderId) where.orderId = orderId
    if (driverId) where.driverId = driverId

    const locations = await db.location.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

// POST create new location update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, driverId, latitude, longitude, speed, heading } = body

    const location = await db.location.create({
      data: {
        orderId,
        driverId,
        latitude,
        longitude,
        speed,
        heading,
      }
    })

    // Also update driver's current location
    await db.driver.update({
      where: { id: driverId },
      data: {
        currentLat: latitude,
        currentLng: longitude,
      }
    })

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}
