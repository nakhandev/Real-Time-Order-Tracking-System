'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Package, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  DollarSign,
  Clock
} from 'lucide-react'
import type { User, Order } from '@/app/page'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderPlacementFormProps {
  currentUser: User | null
  onOrderCreated: (order: Order) => void
}

const sampleLocations = [
  { address: '123 Restaurant Ave, New York, NY', lat: 40.7580, lng: -73.9855 },
  { address: '456 Pizza Place, Brooklyn, NY', lat: 40.6782, lng: -73.9442 },
  { address: '789 Burger Joint, Manhattan, NY', lat: 40.7128, lng: -74.0060 },
  { address: '321 Sushi Bar, Queens, NY', lat: 40.7282, lng: -73.7949 },
]

const sampleDeliveryLocations = [
  { address: '100 Customer St, New York, NY', lat: 40.7484, lng: -73.9857 },
  { address: '200 Home Ave, Brooklyn, NY', lat: 40.6892, lng: -73.9857 },
  { address: '300 Office Blvd, Manhattan, NY', lat: 40.7589, lng: -73.9851 },
  { address: '400 Apartment Dr, Queens, NY', lat: 40.7182, lng: -73.8049 },
]

const popularItems = [
  { name: 'Burger Deluxe', price: 12.99 },
  { name: 'Pepperoni Pizza (Large)', price: 18.99 },
  { name: 'Chicken Wings (10 pcs)', price: 14.99 },
  { name: 'Caesar Salad', price: 9.99 },
  { name: 'French Fries', price: 4.99 },
  { name: 'Fish & Chips', price: 15.99 },
  { name: 'Tacos (3 pcs)', price: 11.99 },
  { name: 'Sushi Combo', price: 22.99 },
  { name: 'Pad Thai', price: 13.99 },
  { name: 'Cola', price: 2.99 },
  { name: 'Iced Tea', price: 3.49 },
  { name: 'Water Bottle', price: 1.99 },
]

export default function OrderPlacementForm({ currentUser, onOrderCreated }: OrderPlacementFormProps) {
  const [items, setItems] = useState<OrderItem[]>([{ name: '', quantity: 1, price: 0 }])
  const [pickupLocation, setPickupLocation] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updated = [...items]
    if (field === 'name') {
      updated[index][field] = value as string
      // Auto-fill price from popular items
      const popularItem = popularItems.find(item => item.name === value)
      if (popularItem) {
        updated[index].price = popularItem.price
      }
    } else {
      updated[index][field] = value as number
    }
    setItems(updated)
  }

  const addPopularItem = (name: string, price: number) => {
    const existingIndex = items.findIndex(item => item.name === name)
    if (existingIndex >= 0) {
      updateItem(existingIndex, 'quantity', items[existingIndex].quantity + 1)
    } else {
      setItems([...items, { name, quantity: 1, price }])
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) {
      alert('Please wait for user data to load')
      return
    }

    const validItems = items.filter(item => item.name && item.price > 0)
    if (validItems.length === 0) {
      alert('Please add at least one item')
      return
    }

    if (!pickupLocation || !deliveryLocation) {
      alert('Please select pickup and delivery locations')
      return
    }

    setIsSubmitting(true)

    try {
      const pickup = sampleLocations.find(loc => loc.address === pickupLocation)
      const delivery = sampleDeliveryLocations.find(loc => loc.address === deliveryLocation)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          pickupAddress: pickupLocation,
          pickupLat: pickup?.lat,
          pickupLng: pickup?.lng,
          deliveryAddress: deliveryLocation,
          deliveryLat: delivery?.lat,
          deliveryLng: delivery?.lng,
          items: validItems,
          notes,
          deliveryFee: 5.99,
        }),
      })

      const data = await response.json()
      
      if (data.order) {
        onOrderCreated(data.order)
        // Reset form
        setItems([{ name: '', quantity: 1, price: 0 }])
        setPickupLocation('')
        setDeliveryLocation('')
        setNotes('')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Order Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            Place New Order
          </CardTitle>
          <CardDescription>
            Fill in the details below to place your delivery order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Locations */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">Pickup Location</Label>
                <Select value={pickupLocation} onValueChange={setPickupLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pickup location" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleLocations.map((loc) => (
                      <SelectItem key={loc.address} value={loc.address}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          {loc.address}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery">Delivery Location</Label>
                <Select value={deliveryLocation} onValueChange={setDeliveryLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery location" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleDeliveryLocations.map((loc) => (
                      <SelectItem key={loc.address} value={loc.address}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          {loc.address}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      list={`items-${index}`}
                    />
                    <datalist id={`items-${index}`}>
                      {popularItems.map((p) => (
                        <option key={p.name} value={p.name} />
                      ))}
                    </datalist>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    className="w-20"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-24"
                    placeholder="Price"
                    value={item.price || ''}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for the driver..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Placing Order...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Place Order
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Add & Summary */}
      <div className="space-y-4">
        {/* Quick Add Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Add</CardTitle>
            <CardDescription>Click to add popular items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularItems.slice(0, 8).map((item) => (
                <Button
                  key={item.name}
                  variant="outline"
                  size="sm"
                  onClick={() => addPopularItem(item.name, item.price)}
                  className="h-auto py-1.5"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {item.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {items.filter(i => i.name).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Fee</span>
              <span>$5.99</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-orange-500">${(calculateTotal() + 5.99).toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
              <Clock className="h-4 w-4" />
              <span>Estimated delivery: 25-35 min</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
