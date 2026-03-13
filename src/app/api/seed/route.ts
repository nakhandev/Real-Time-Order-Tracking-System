import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create sample users
    const customers = await Promise.all([
      db.user.create({
        data: {
          email: 'john@example.com',
          name: 'John Doe',
          phone: '+1234567890',
          role: 'customer',
        }
      }),
      db.user.create({
        data: {
          email: 'jane@example.com',
          name: 'Jane Smith',
          phone: '+1234567891',
          role: 'customer',
        }
      }),
    ])

    // Create sample drivers
    const driverUsers = await Promise.all([
      db.user.create({
        data: {
          email: 'driver1@example.com',
          name: 'Mike Wilson',
          phone: '+1234567892',
          role: 'driver',
        }
      }),
      db.user.create({
        data: {
          email: 'driver2@example.com',
          name: 'Sarah Brown',
          phone: '+1234567893',
          role: 'driver',
        }
      }),
      db.user.create({
        data: {
          email: 'driver3@example.com',
          name: 'Tom Davis',
          phone: '+1234567894',
          role: 'driver',
        }
      }),
    ])

    const drivers = await Promise.all([
      db.driver.create({
        data: {
          userId: driverUsers[0].id,
          vehicleType: 'motorcycle',
          vehiclePlate: 'MOTO-123',
          isActive: true,
          isAvailable: true,
          rating: 4.8,
          totalDeliveries: 150,
          currentLat: 40.7128,
          currentLng: -74.0060,
        }
      }),
      db.driver.create({
        data: {
          userId: driverUsers[1].id,
          vehicleType: 'car',
          vehiclePlate: 'CAR-456',
          isActive: true,
          isAvailable: true,
          rating: 4.9,
          totalDeliveries: 230,
          currentLat: 40.7580,
          currentLng: -73.9855,
        }
      }),
      db.driver.create({
        data: {
          userId: driverUsers[2].id,
          vehicleType: 'bicycle',
          isActive: true,
          isAvailable: false,
          rating: 4.7,
          totalDeliveries: 85,
          currentLat: 40.7484,
          currentLng: -73.9857,
        }
      }),
    ])

    // Create sample orders
    const orderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    const orders = await Promise.all([
      db.order.create({
        data: {
          orderNumber: orderNumber(),
          customerId: customers[0].id,
          pickupAddress: '123 Restaurant Ave, New York, NY',
          pickupLat: 40.7580,
          pickupLng: -73.9855,
          deliveryAddress: '456 Customer St, New York, NY',
          deliveryLat: 40.7484,
          deliveryLng: -73.9857,
          items: JSON.stringify([
            { name: 'Burger Deluxe', quantity: 2, price: 12.99 },
            { name: 'French Fries', quantity: 2, price: 4.99 },
            { name: 'Cola', quantity: 2, price: 2.99 },
          ]),
          totalAmount: 41.94,
          deliveryFee: 5.99,
          status: 'pending',
          estimatedTime: 30,
        }
      }),
      db.order.create({
        data: {
          orderNumber: orderNumber(),
          customerId: customers[1].id,
          driverId: drivers[0].id,
          pickupAddress: '789 Pizza Place, New York, NY',
          pickupLat: 40.7128,
          pickupLng: -74.0060,
          deliveryAddress: '321 Home Ave, New York, NY',
          deliveryLat: 40.7200,
          deliveryLng: -74.0000,
          items: JSON.stringify([
            { name: 'Large Pepperoni Pizza', quantity: 1, price: 18.99 },
            { name: 'Garlic Bread', quantity: 1, price: 5.99 },
          ]),
          totalAmount: 24.98,
          deliveryFee: 4.99,
          status: 'in_transit',
          estimatedTime: 15,
        }
      }),
    ])

    // Create sample notifications
    await Promise.all([
      db.notification.create({
        data: {
          orderId: orders[0].id,
          type: 'order_confirmed',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed and is being prepared.',
        }
      }),
      db.notification.create({
        data: {
          orderId: orders[1].id,
          type: 'driver_assigned',
          title: 'Driver Assigned',
          message: 'Mike Wilson is on the way to pick up your order.',
        }
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        customers: customers.length,
        drivers: drivers.length,
        orders: orders.length,
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
