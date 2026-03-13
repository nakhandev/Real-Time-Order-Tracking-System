import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        driver: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PUT update order (status, driver assignment, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, driverId } = body

    const updateData: Record<string, unknown> = { ...body }

    // Handle status changes with timestamps
    if (status) {
      updateData.status = status
      if (status === 'confirmed') updateData.confirmedAt = new Date()
      if (status === 'picked_up') updateData.pickedUpAt = new Date()
      if (status === 'delivered') updateData.deliveredAt = new Date()
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        driver: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
      }
    })

    // Create notification for status changes
    if (status) {
      const statusMessages: Record<string, { title: string; message: string }> = {
        confirmed: { title: 'Order Confirmed', message: 'Your order has been confirmed.' },
        preparing: { title: 'Preparing Order', message: 'Your order is being prepared.' },
        picked_up: { title: 'Order Picked Up', message: 'Driver has picked up your order.' },
        in_transit: { title: 'On The Way', message: 'Your order is on the way!' },
        delivered: { title: 'Delivered', message: 'Your order has been delivered. Enjoy!' },
        cancelled: { title: 'Order Cancelled', message: 'Your order has been cancelled.' },
      }

      const notif = statusMessages[status]
      if (notif) {
        await db.notification.create({
          data: {
            orderId: id,
            type: `order_${status}`,
            title: notif.title,
            message: notif.message,
          }
        })
      }
    }

    // Handle driver assignment
    if (driverId) {
      await db.notification.create({
        data: {
          orderId: id,
          type: 'driver_assigned',
          title: 'Driver Assigned',
          message: 'A driver has been assigned to your order.',
        }
      })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete related records first
    await db.location.deleteMany({ where: { orderId: id } })
    await db.notification.deleteMany({ where: { orderId: id } })
    
    await db.order.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Order deleted' })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
