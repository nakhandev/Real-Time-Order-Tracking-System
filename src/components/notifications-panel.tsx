'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  CheckCircle, 
  Truck, 
  Package, 
  AlertCircle,
  MapPin,
  Clock,
  X
} from 'lucide-react'
import type { Notification } from '@/app/page'

interface NotificationsPanelProps {
  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order_placed':
    case 'order_confirmed':
      return <CheckCircle className="h-5 w-5 text-blue-500" />
    case 'driver_assigned':
      return <Truck className="h-5 w-5 text-purple-500" />
    case 'order_picked_up':
      return <Package className="h-5 w-5 text-orange-500" />
    case 'order_in_transit':
      return <MapPin className="h-5 w-5 text-cyan-500" />
    case 'order_delivered':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'order_cancelled':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    default:
      return <Bell className="h-5 w-5 text-gray-500" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'order_placed':
    case 'order_confirmed':
      return 'border-l-blue-500 bg-blue-50'
    case 'driver_assigned':
      return 'border-l-purple-500 bg-purple-50'
    case 'order_picked_up':
      return 'border-l-orange-500 bg-orange-50'
    case 'order_in_transit':
      return 'border-l-cyan-500 bg-cyan-50'
    case 'order_delivered':
      return 'border-l-green-500 bg-green-50'
    case 'order_cancelled':
      return 'border-l-red-500 bg-red-50'
    default:
      return 'border-l-gray-500 bg-gray-50'
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export default function NotificationsPanel({ notifications, setNotifications }: NotificationsPanelProps) {
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Sample notifications if empty
  const displayNotifications = notifications.length > 0 ? notifications : [
    {
      id: 'sample-1',
      orderId: 'sample',
      type: 'order_confirmed',
      title: 'Order Confirmed',
      message: 'Your order has been confirmed and is being prepared.',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'sample-2',
      orderId: 'sample',
      type: 'driver_assigned',
      title: 'Driver Assigned',
      message: 'Mike Wilson has been assigned to deliver your order.',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
    {
      id: 'sample-3',
      orderId: 'sample',
      type: 'order_in_transit',
      title: 'On The Way',
      message: 'Your order is on the way! Estimated arrival: 15 minutes.',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  {notifications.filter(n => !n.isRead).length} unread notifications
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                disabled={notifications.every(n => n.isRead)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border-l-4 transition-all cursor-pointer
                    ${getNotificationColor(notification.type)}
                    ${!notification.isRead ? 'shadow-sm' : 'opacity-70'}
                  `}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {displayNotifications.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No Notifications</h3>
                  <p className="text-gray-500 mt-2">
                    You're all caught up! Check back later for updates.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Notification Types Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { type: 'order_placed', label: 'Order Placed' },
              { type: 'driver_assigned', label: 'Driver Assigned' },
              { type: 'order_picked_up', label: 'Picked Up' },
              { type: 'order_in_transit', label: 'In Transit' },
              { type: 'order_delivered', label: 'Delivered' },
              { type: 'order_cancelled', label: 'Cancelled' },
            ].map(({ type, label }) => (
              <div 
                key={type}
                className="flex items-center gap-2 text-sm"
              >
                {getNotificationIcon(type)}
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
