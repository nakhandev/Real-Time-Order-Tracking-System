import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET all orders or filter by customerId, driverId, status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const driverId = searchParams.get('driverId')
    const status = searchParams.get('status')
    const orderNumber = searchParams.get('orderNumber')

    const where: Record<string, unknown> = {}
    
    if (customerId) where.customerId = customerId
    if (driverId) where.driverId = driverId
    if (status) where.status = status
    if (orderNumber) where.orderNumber = orderNumber

    const orders = await db.order.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        driver: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      pickupAddress,
      pickupLat,
      pickupLng,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      items,
      notes,
      deliveryFee = 5.99,
    } = body

    // Calculate total from items
    const totalAmount = items.reduce((sum: number, item: { price: number; quantity: number }) => 
      sum + item.price * item.quantity, 0)

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId,
        pickupAddress,
        pickupLat,
        pickupLng,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        items: JSON.stringify(items),
        totalAmount,
        deliveryFee,
        notes,
        status: 'pending',
        estimatedTime: 30,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
      }
    })

    // Create notification
    await db.notification.create({
      data: {
        orderId: order.id,
        type: 'order_placed',
        title: 'Order Placed',
        message: `Your order ${orderNumber} has been placed successfully.`,
      }
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
