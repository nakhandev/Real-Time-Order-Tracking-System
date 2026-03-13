import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET single driver by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const driver = await db.driver.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        orders: {
          where: { status: { in: ['in_transit', 'picked_up'] } },
          include: {
            customer: { select: { id: true, name: true, phone: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Get driver error:', error)
    return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 })
  }
}

// PUT update driver (location, availability, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { currentLat, currentLng, isAvailable, isActive } = body

    const updateData: Record<string, unknown> = {}
    
    if (currentLat !== undefined) updateData.currentLat = currentLat
    if (currentLng !== undefined) updateData.currentLng = currentLng
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable
    if (isActive !== undefined) updateData.isActive = isActive

    const driver = await db.driver.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    })

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Update driver error:', error)
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}
