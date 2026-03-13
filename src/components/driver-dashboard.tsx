'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle, 
  User,
  Phone,
  Bike,
  Car,
  Star,
  Package,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react'
import type { Driver, Socket } from '@/app/page'

interface DriverDashboardProps {
  drivers: Driver[]
  socket: Socket | null
  isConnected: boolean
}

interface SimulatedLocation {
  lat: number
  lng: number
  speed: number
  heading: number
}

export default function DriverDashboard({ drivers, socket, isConnected }: DriverDashboardProps) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<SimulatedLocation | null>(null)
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [deliveryStats] = useState({
    todayDeliveries: 12,
    totalEarnings: 156.50,
    avgRating: 4.8,
    activeOrders: 2,
  })

  // Simulate location updates
  const simulateLocation = useCallback(() => {
    if (!selectedDriver) return

    // NYC area coordinates
    const baseLat = selectedDriver.currentLat || 40.7128
    const baseLng = selectedDriver.currentLng || -74.0060

    // Random movement
    const newLat = baseLat + (Math.random() - 0.5) * 0.002
    const newLng = baseLng + (Math.random() - 0.5) * 0.002
    const speed = 15 + Math.random() * 25 // 15-40 km/h
    const heading = Math.random() * 360

    const location: SimulatedLocation = {
      lat: newLat,
      lng: newLng,
      speed: Math.round(speed),
      heading: Math.round(heading),
    }

    setCurrentLocation(location)

    // Emit location update via socket
    if (socket && isOnline) {
      socket.emit('driver:location', {
        driverId: selectedDriver.id,
        latitude: newLat,
        longitude: newLng,
        speed,
        heading,
        timestamp: new Date(),
      })
    }
  }, [selectedDriver, socket, isOnline])

  // Start/stop simulation
  useEffect(() => {
    if (isSimulating && selectedDriver) {
      simulationIntervalRef.current = setInterval(simulateLocation, 2000)
      return () => {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current)
          simulationIntervalRef.current = null
        }
      }
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
        simulationIntervalRef.current = null
      }
    }
  }, [isSimulating, simulateLocation, selectedDriver])

  // Handle driver online/offline
  const handleToggleOnline = async (driver: Driver) => {
    if (!socket) return

    if (!isOnline) {
      socket.emit('driver:online', { driverId: driver.id })
      setIsOnline(true)
      setSelectedDriver(driver)
    } else {
      socket.emit('driver:offline', { driverId: driver.id })
      setIsOnline(false)
      setIsSimulating(false)
      setSelectedDriver(null)
    }
  }

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="h-5 w-5" />
      case 'motorcycle': return <Bike className="h-5 w-5" />
      case 'bicycle': return <Bike className="h-5 w-5" />
      default: return <Truck className="h-5 w-5" />
    }
  }

  const sampleOrders = [
    {
      id: '1',
      orderNumber: 'ORD-1234-ABCD',
      customer: 'John Doe',
      pickup: '123 Restaurant Ave',
      delivery: '456 Customer St',
      status: 'pending',
      eta: 15,
      fee: 5.99,
    },
    {
      id: '2',
      orderNumber: 'ORD-5678-EFGH',
      customer: 'Jane Smith',
      pickup: '789 Pizza Place',
      delivery: '321 Home Ave',
      status: 'ready',
      eta: 10,
      fee: 4.99,
    },
  ]

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Driver Selection & Stats */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Driver Dashboard
          </CardTitle>
          <CardDescription>
            Manage your deliveries and track your earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="drivers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="drivers">Select Driver</TabsTrigger>
              <TabsTrigger value="orders">Active Orders</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>

            {/* Driver Selection */}
            <TabsContent value="drivers" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {drivers.map((driver) => (
                  <Card 
                    key={driver.id}
                    className={`cursor-pointer transition-all ${
                      selectedDriver?.id === driver.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : ''
                    }`}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{driver.user.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {getVehicleIcon(driver.vehicleType)}
                              <span className="capitalize">{driver.vehicleType}</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={driver.isAvailable ? "default" : "secondary"}
                          className={driver.isAvailable ? 'bg-green-500' : 'bg-gray-400'}
                        >
                          {driver.isAvailable ? 'Available' : 'Busy'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{driver.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-500">{driver.totalDeliveries} deliveries</span>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`online-${driver.id}`} className="text-sm">
                            Go Online
                          </Label>
                          <Switch
                            id={`online-${driver.id}`}
                            checked={isOnline && selectedDriver?.id === driver.id}
                            onCheckedChange={() => handleToggleOnline(driver)}
                            disabled={!isConnected}
                          />
                        </div>
                        
                        {selectedDriver?.id === driver.id && isOnline && (
                          <Button
                            size="sm"
                            variant={isSimulating ? "destructive" : "default"}
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsSimulating(!isSimulating)
                            }}
                          >
                            {isSimulating ? (
                              <><Pause className="h-4 w-4 mr-1" /> Stop</>
                            ) : (
                              <><Play className="h-4 w-4 mr-1" /> Simulate</>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Current Location Display */}
              {currentLocation && (
                <Card className="bg-cyan-50 border-cyan-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                        <Navigation className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Current Location</span>
                          <Badge variant="outline" className="bg-cyan-100 text-cyan-700">
                            Live
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span>Lat: {currentLocation.lat.toFixed(6)}</span>
                          <span>Lng: {currentLocation.lng.toFixed(6)}</span>
                          <span>Speed: {currentLocation.speed} km/h</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Active Orders */}
            <TabsContent value="orders" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {sampleOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{order.orderNumber}</h4>
                            <p className="text-sm text-gray-500">{order.customer}</p>
                          </div>
                          <Badge className={
                            order.status === 'pending' ? 'bg-yellow-500' :
                            order.status === 'ready' ? 'bg-green-500' :
                            'bg-blue-500'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span>{order.pickup}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span>{order.delivery}</span>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {order.eta} min
                            </span>
                            <span className="text-green-600 font-medium">
                              ${order.fee.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              <Navigation className="h-4 w-4 mr-1" />
                              Navigate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Earnings */}
            <TabsContent value="earnings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Today's Deliveries</p>
                        <p className="text-2xl font-bold text-green-600">
                          {deliveryStats.todayDeliveries}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Active Orders</p>
                        <p className="text-2xl font-bold text-cyan-600">
                          {deliveryStats.activeOrders}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-white fill-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Rating</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {deliveryStats.avgRating}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Today's Earnings</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ${deliveryStats.totalEarnings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Earnings History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {[
                        { time: '2:30 PM', order: 'ORD-1234', amount: 5.99 },
                        { time: '1:45 PM', order: 'ORD-5678', amount: 4.99 },
                        { time: '12:30 PM', order: 'ORD-9012', amount: 6.99 },
                        { time: '11:15 AM', order: 'ORD-3456', amount: 5.49 },
                        { time: '10:00 AM', order: 'ORD-7890', amount: 7.99 },
                      ].map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{item.time}</span>
                            <span className="text-sm font-medium">{item.order}</span>
                          </div>
                          <span className="text-green-600 font-medium">
                            +${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected to tracking service' : 'Disconnected'}
              </span>
            </div>
            {isOnline && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                You are online and visible to customers
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Complete Current Order
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
              Report an Issue
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              Take a Break
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Driver Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Keep your location services enabled for accurate tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Call customers when you arrive at the pickup location</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Update order status promptly for better customer experience</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
