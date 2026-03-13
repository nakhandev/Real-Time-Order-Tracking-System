'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Truck,
  CheckCircle,
  Circle,
  DollarSign,
  Phone,
  MessageSquare
} from 'lucide-react'
import type { Order } from '@/app/page'

interface OrderStatusTrackerProps {
  order: Order
  getStatusIcon: (status: string) => JSX.Element
  getStatusColor: (status: string) => string
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', description: 'Waiting for confirmation' },
  { key: 'confirmed', label: 'Confirmed', description: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', description: 'Your order is being prepared' },
  { key: 'picked_up', label: 'Picked Up', description: 'Driver picked up your order' },
  { key: 'in_transit', label: 'On The Way', description: 'Driver is heading to you' },
  { key: 'delivered', label: 'Delivered', description: 'Order delivered successfully' },
]

export default function OrderStatusTracker({ order, getStatusIcon, getStatusColor }: OrderStatusTrackerProps) {
  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status)
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const parseItems = () => {
    try {
      return JSON.parse(order.items)
    } catch {
      return []
    }
  }

  const items = parseItems()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
            <CardDescription>
              Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Timeline */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Order Progress</h3>
          <div className="space-y-3">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                      }
                      ${isCurrent ? 'ring-4 ring-green-100' : ''}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`w-0.5 h-8 ${isCompleted && index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Addresses */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Delivery Details</h3>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pickup</p>
              <p className="text-gray-900">{order.pickupAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Delivery</p>
              <p className="text-gray-900">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Order Items */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Order Items</h3>
          <div className="space-y-2">
            {items.map((item: { name: string; quantity: number; price: number }, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span>{item.name}</span>
                  <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>
                </div>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Payment Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery Fee</span>
            <span>${order.deliveryFee.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-green-600">${(order.totalAmount + order.deliveryFee).toFixed(2)}</span>
          </div>
        </div>

        {order.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Special Instructions</h3>
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
            </div>
          </>
        )}

        {/* Driver Info */}
        {order.driver && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Driver</h3>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium">{order.driver.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {order.driver.vehicleType} • ⭐ {order.driver.rating.toFixed(1)} ({order.driver.totalDeliveries} deliveries)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Estimated Time */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && order.estimatedTime && (
          <div className="flex items-center justify-center gap-2 p-4 bg-cyan-50 rounded-lg">
            <Clock className="h-5 w-5 text-cyan-600" />
            <span className="font-medium text-cyan-700">
              Estimated arrival: {order.estimatedTime} minutes
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
