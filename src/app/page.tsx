'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Truck, 
  MapPin, 
  Bell, 
  User, 
  Navigation,
  CheckCircle,
  Clock,
  AlertCircle,
  Bike,
  Car,
  Wifi,
  WifiOff
} from 'lucide-react'
import OrderPlacementForm from '@/components/order-placement-form'
import OrderTrackingMap from '@/components/order-tracking-map'
import OrderStatusTracker from '@/components/order-status-tracker'
import NotificationsPanel from '@/components/notifications-panel'
import DriverDashboard from '@/components/driver-dashboard'
import OrdersList from '@/components/orders-list'

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  driverId: string | null
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  driver?: {
    id: string
    user: {
      id: string
      name: string
      email: string
      phone: string | null
    }
    vehicleType: string
    vehiclePlate: string | null
    rating: number
  } | null
  pickupAddress: string
  pickupLat: number | null
  pickupLng: number | null
  deliveryAddress: string
  deliveryLat: number | null
  deliveryLng: number | null
  items: string
  totalAmount: number
  deliveryFee: number
  notes: string | null
  status: string
  estimatedTime: number | null
  createdAt: string
  updatedAt: string
  locations?: LocationUpdate[]
  notifications?: Notification[]
}

export interface LocationUpdate {
  id: string
  orderId: string | null
  driverId: string
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  timestamp: string
}

export interface Notification {
  id: string
  orderId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface Driver {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  vehicleType: string
  vehiclePlate: string | null
  isActive: boolean
  isAvailable: boolean
  rating: number
  totalDeliveries: number
  currentLat: number | null
  currentLng: number | null
}

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
}

export default function DeliveryTrackingApp() {
  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [driverLocation, setDriverLocation] = useState<LocationUpdate | null>(null)
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoading, setIsLoading] = useState(true)

  // Define fetchOrders first before using it in effects
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    // Initialize socket in ref
    socketRef.current = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    const socketInstance = socketRef.current

    socketInstance.on('connect', () => {
      setIsConnected(true)
      setSocket(socketInstance)
      console.log('Connected to tracking service')
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from tracking service')
    })

    // Location updates
    socketInstance.on('location:update', (data: LocationUpdate) => {
      console.log('Location update received:', data)
      setDriverLocation(data)
    })

    // Order status updates
    socketInstance.on('order:status', (data: { orderId: string; status: string; message: string }) => {
      console.log('Order status update:', data)
      setOrders(prev => prev.map(order => 
        order.id === data.orderId ? { ...order, status: data.status } : order
      ))
      if (selectedOrder?.id === data.orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: data.status } : null)
      }
    })

    // Notifications
    socketInstance.on('notification:new', (data: Notification) => {
      console.log('New notification:', data)
      setNotifications(prev => [data, ...prev])
    })

    // Order delivered
    socketInstance.on('order:delivered', (data: { orderId: string }) => {
      console.log('Order delivered:', data)
      setOrders(prev => prev.map(order => 
        order.id === data.orderId ? { ...order, status: 'delivered' } : order
      ))
    })

    // Driver assigned - refresh orders to get updated driver info
    socketInstance.on('order:driver-assigned', (data: { orderId: string; driverId: string }) => {
      console.log('Driver assigned:', data)
      // Update orders state directly instead of calling fetchOrders
      setOrders(prev => prev.map(order =>
        order.id === data.orderId ? { ...order, driverId: data.driverId } : order
      ))
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Seed database first
        await fetch('/api/seed')
        
        // Fetch users and set current user (first customer)
        const usersRes = await fetch('/api/users?role=customer')
        const usersData = await usersRes.json()
        if (usersData.users?.length > 0) {
          setCurrentUser(usersData.users[0])
        }

        // Fetch orders
        const ordersRes = await fetch('/api/orders')
        const ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])

        // Fetch drivers
        const driversRes = await fetch('/api/drivers')
        const driversData = await driversRes.json()
        setDrivers(driversData.drivers || [])

        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleOrderCreated = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev])
    setSelectedOrder(order)
    
    // Join tracking room
    if (socket && currentUser) {
      socket.emit('customer:track-order', {
        orderId: order.id,
        customerId: currentUser.id
      })
    }

    // Notify drivers about new order
    if (socket) {
      socket.emit('order:new', {
        orderId: order.id,
        pickup: order.pickupAddress,
        delivery: order.deliveryAddress
      })
    }

    setActiveTab('tracking')
  }, [socket, currentUser])

  const handleSelectOrder = useCallback((order: Order) => {
    setSelectedOrder(order)
    setActiveTab('tracking')
    
    // Join tracking room
    if (socket && currentUser) {
      socket.emit('customer:track-order', {
        orderId: order.id,
        customerId: currentUser.id
      })
    }
  }, [socket, currentUser])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'preparing': return <Package className="h-4 w-4" />
      case 'picked_up': return <Package className="h-4 w-4" />
      case 'in_transit': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'confirmed': return 'bg-blue-500'
      case 'preparing': return 'bg-orange-500'
      case 'picked_up': return 'bg-purple-500'
      case 'in_transit': return 'bg-cyan-500'
      case 'delivered': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading delivery tracking...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DeliverNow</h1>
                <p className="text-xs text-gray-500">Real-time Order Tracking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                variant={isConnected ? "default" : "secondary"} 
                className={`${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}
              >
                {isConnected ? (
                  <><Wifi className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>
                )}
              </Badge>
              
              {currentUser && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="new-order" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">New Order</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Track</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="driver" className="gap-2">
              <Bike className="h-4 w-4" />
              <span className="hidden sm:inline">Driver</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders List Tab */}
          <TabsContent value="orders" className="space-y-4">
            <OrdersList 
              orders={orders} 
              onSelectOrder={handleSelectOrder}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          {/* New Order Tab */}
          <TabsContent value="new-order" className="space-y-4">
            <OrderPlacementForm 
              currentUser={currentUser}
              onOrderCreated={handleOrderCreated}
            />
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            {selectedOrder ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <OrderStatusTracker 
                    order={selectedOrder}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                </div>
                <div className="space-y-4">
                  <OrderTrackingMap 
                    order={selectedOrder}
                    driverLocation={driverLocation}
                  />
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No Order Selected</h3>
                  <p className="text-gray-500 mt-2">Select an order from the list to track its delivery</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab('orders')}
                  >
                    View Orders
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <NotificationsPanel 
              notifications={notifications}
              setNotifications={setNotifications}
            />
          </TabsContent>

          {/* Driver Dashboard Tab */}
          <TabsContent value="driver" className="space-y-4">
            <DriverDashboard 
              drivers={drivers}
              socket={socket}
              isConnected={isConnected}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>🚀 Real-time Order Tracking System • Powered by Socket.io & Next.js</p>
        </div>
      </footer>
    </div>
  )
}
