import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface DriverLocation {
  driverId: string
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  timestamp: Date
}

interface OrderUpdate {
  orderId: string
  status: string
  message: string
  timestamp: Date
}

interface Notification {
  id: string
  orderId: string
  type: string
  title: string
  message: string
  timestamp: Date
}

// In-memory storage for active connections
const driverSockets = new Map<string, string>() // driverId -> socketId
const customerOrders = new Map<string, Set<string>>() // customerId -> Set of orderIds
const orderRooms = new Map<string, Set<string>>() // orderId -> Set of socketIds

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9)

console.log('🚀 Real-time Tracking Service Starting...')

io.on('connection', (socket) => {
  console.log(`📱 Client connected: ${socket.id}`)

  // ============ DRIVER EVENTS ============
  
  // Driver goes online
  socket.on('driver:online', (data: { driverId: string }) => {
    console.log(`🚗 Driver online: ${data.driverId}`)
    driverSockets.set(data.driverId, socket.id)
    socket.join(`driver:${data.driverId}`)
    socket.data.driverId = data.driverId
    socket.data.role = 'driver'
    
    socket.emit('driver:online:ack', { 
      success: true, 
      message: 'Driver is now online',
      timestamp: new Date().toISOString()
    })
  })

  // Driver goes offline
  socket.on('driver:offline', (data: { driverId: string }) => {
    console.log(`🚗 Driver offline: ${data.driverId}`)
    driverSockets.delete(data.driverId)
    socket.leave(`driver:${data.driverId}`)
    
    socket.emit('driver:offline:ack', { 
      success: true,
      timestamp: new Date().toISOString()
    })
  })

  // Driver location update
  socket.on('driver:location', (data: DriverLocation) => {
    console.log(`📍 Driver ${data.driverId} location: ${data.latitude}, ${data.longitude}`)
    
    // Broadcast to all customers tracking this driver's orders
    const locationUpdate = {
      ...data,
      timestamp: data.timestamp || new Date()
    }
    
    // Emit to driver's room (for customers tracking)
    io.emit(`driver:${data.driverId}:location`, locationUpdate)
    
    // Also emit to any active order rooms this driver is part of
    if (socket.data.activeOrders) {
      socket.data.activeOrders.forEach((orderId: string) => {
        io.to(`order:${orderId}`).emit('location:update', locationUpdate)
      })
    }
  })

  // Driver accepts an order
  socket.on('driver:accept-order', (data: { orderId: string, driverId: string }) => {
    console.log(`✅ Driver ${data.driverId} accepted order ${data.orderId}`)
    
    if (!socket.data.activeOrders) {
      socket.data.activeOrders = new Set()
    }
    socket.data.activeOrders.add(data.orderId)
    
    socket.join(`order:${data.orderId}`)
    
    io.to(`order:${data.orderId}`).emit('order:driver-assigned', {
      orderId: data.orderId,
      driverId: data.driverId,
      timestamp: new Date()
    })
  })

  // Driver completes an order
  socket.on('driver:complete-order', (data: { orderId: string, driverId: string }) => {
    console.log(`📦 Driver ${data.driverId} completed order ${data.orderId}`)
    
    if (socket.data.activeOrders) {
      socket.data.activeOrders.delete(data.orderId)
    }
    
    io.to(`order:${data.orderId}`).emit('order:delivered', {
      orderId: data.orderId,
      timestamp: new Date()
    })
  })

  // ============ CUSTOMER EVENTS ============
  
  // Customer joins order tracking
  socket.on('customer:track-order', (data: { orderId: string, customerId: string }) => {
    console.log(`👤 Customer ${data.customerId} tracking order ${data.orderId}`)
    
    socket.join(`order:${data.orderId}`)
    socket.join(`customer:${data.customerId}`)
    socket.data.customerId = data.customerId
    socket.data.role = 'customer'
    
    // Track customer's orders
    if (!customerOrders.has(data.customerId)) {
      customerOrders.set(data.customerId, new Set())
    }
    customerOrders.get(data.customerId)!.add(data.orderId)
    
    // Track order room
    if (!orderRooms.has(data.orderId)) {
      orderRooms.set(data.orderId, new Set())
    }
    orderRooms.get(data.orderId)!.add(socket.id)
    
    socket.emit('customer:track:ack', { 
      success: true, 
      orderId: data.orderId,
      message: `Now tracking order ${data.orderId}`,
      timestamp: new Date().toISOString()
    })
  })

  // Customer stops tracking order
  socket.on('customer:stop-tracking', (data: { orderId: string, customerId: string }) => {
    console.log(`👤 Customer ${data.customerId} stopped tracking order ${data.orderId}`)
    
    socket.leave(`order:${data.orderId}`)
    
    if (customerOrders.has(data.customerId)) {
      customerOrders.get(data.customerId)!.delete(data.orderId)
    }
    
    if (orderRooms.has(data.orderId)) {
      orderRooms.get(data.orderId)!.delete(socket.id)
    }
  })

  // ============ ORDER STATUS EVENTS ============
  
  // Order status update (from backend or driver)
  socket.on('order:status-update', (data: OrderUpdate) => {
    console.log(`📋 Order ${data.orderId} status: ${data.status}`)
    
    io.to(`order:${data.orderId}`).emit('order:status', data)
  })

  // New order notification to available drivers
  socket.on('order:new', (data: { orderId: string, pickup: string, delivery: string }) => {
    console.log(`🆕 New order ${data.orderId} broadcasted to drivers`)
    
    // Emit to all drivers (in a real app, you'd filter by location/availability)
    io.emit('driver:new-order', data)
  })

  // ============ NOTIFICATION EVENTS ============
  
  // Send notification to specific user
  socket.on('notification:send', (data: { customerId: string, notification: Notification }) => {
    console.log(`🔔 Notification for customer ${data.customerId}: ${data.notification.title}`)
    
    io.to(`customer:${data.customerId}`).emit('notification:new', data.notification)
  })

  // Broadcast notification to order room
  socket.on('notification:order', (data: { orderId: string, notification: Notification }) => {
    console.log(`🔔 Notification for order ${data.orderId}: ${data.notification.title}`)
    
    io.to(`order:${data.orderId}`).emit('notification:new', data.notification)
  })

  // ============ DISCONNECT ============
  
  socket.on('disconnect', () => {
    console.log(`📱 Client disconnected: ${socket.id}`)
    
    // Clean up driver data
    if (socket.data.driverId) {
      driverSockets.delete(socket.data.driverId)
      console.log(`🚗 Driver ${socket.data.driverId} removed from active drivers`)
    }
    
    // Clean up customer data
    if (socket.data.customerId) {
      const orders = customerOrders.get(socket.data.customerId)
      if (orders) {
        orders.forEach(orderId => {
          const room = orderRooms.get(orderId)
          if (room) {
            room.delete(socket.id)
          }
        })
        customerOrders.delete(socket.data.customerId)
      }
    }
  })

  socket.on('error', (error) => {
    console.error(`❌ Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`🚀 Real-time Tracking Service running on port ${PORT}`)
  console.log(`📡 Socket.io server ready for connections`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM signal, shutting down...')
  httpServer.close(() => {
    console.log('🔌 Tracking service closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT signal, shutting down...')
  httpServer.close(() => {
    console.log('🔌 Tracking service closed')
    process.exit(0)
  })
})
