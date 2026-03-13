import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET all drivers or filter by availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAvailable = searchParams.get('available')
    const isActive = searchParams.get('active')

    const where: Record<string, unknown> = {}
    
    if (isAvailable !== null) where.isAvailable = isAvailable === 'true'
    if (isActive !== null) where.isActive = isActive === 'true'

    const drivers = await db.driver.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } }
      },
      orderBy: { rating: 'desc' },
    })

    return NextResponse.json({ drivers })
  } catch (error) {
    console.error('Get drivers error:', error)
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
  }
}

// POST create new driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vehicleType, vehiclePlate } = body

    const driver = await db.driver.create({
      data: {
        userId,
        vehicleType,
        vehiclePlate,
        isActive: true,
        isAvailable: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    })

    return NextResponse.json({ driver }, { status: 201 })
  } catch (error) {
    console.error('Create driver error:', error)
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 })
  }
}
