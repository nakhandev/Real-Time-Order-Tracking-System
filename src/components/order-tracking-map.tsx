'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Truck, Clock, Phone } from 'lucide-react'
import type { Order, LocationUpdate } from '@/app/page'

interface OrderTrackingMapProps {
  order: Order
  driverLocation: LocationUpdate | null
}

// Dynamic import for Leaflet to avoid SSR issues
export default function OrderTrackingMap({ order, driverLocation }: OrderTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<{
    map: unknown
    L: unknown
    markers: Record<string, unknown>
  } | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstance) return

    const loadMap = async () => {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')

        // Fix default marker icons
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Create custom icons
        const pickupIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        const deliveryIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        const driverIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        // Calculate center
        const pickupLat = order.pickupLat || 40.7128
        const pickupLng = order.pickupLng || -74.0060
        const deliveryLat = order.deliveryLat || 40.7484
        const deliveryLng = order.deliveryLng || -73.9857
        
        const centerLat = (pickupLat + deliveryLat) / 2
        const centerLng = (pickupLng + deliveryLng) / 2

        // Create map
        const map = L.map(mapRef.current).setView([centerLat, centerLng], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map)

        const markers: Record<string, unknown> = {}

        // Add pickup marker
        markers.pickup = L.marker([pickupLat, pickupLng], { icon: pickupIcon })
          .addTo(map)
          .bindPopup(`<b>Pickup</b><br>${order.pickupAddress}`)

        // Add delivery marker
        markers.delivery = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon })
          .addTo(map)
          .bindPopup(`<b>Delivery</b><br>${order.deliveryAddress}`)

        // Draw route line
        L.polyline([[pickupLat, pickupLng], [deliveryLat, deliveryLng]], {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10'
        }).addTo(map)

        // Fit bounds
        const bounds = L.latLngBounds([[pickupLat, pickupLng], [deliveryLat, deliveryLng]])
        map.fitBounds(bounds, { padding: [50, 50] })

        setMapInstance({ map, L, markers })
        setIsMapLoaded(true)
      } catch (error) {
        console.error('Error loading map:', error)
      }
    }

    loadMap()

    return () => {
      if (mapInstance?.map) {
        (mapInstance.map as { remove: () => void }).remove()
      }
    }
  }, [order.id])

  // Update driver marker when location changes
  useEffect(() => {
    if (!mapInstance || !driverLocation) return

    const { map, L, markers } = mapInstance

    // Remove existing driver marker
    if (markers.driver) {
      (markers.driver as { remove: () => void }).remove()
    }

    // Create driver icon
    const driverIcon = (L as unknown as { divIcon: (options: unknown) => unknown }).divIcon({
      className: 'custom-marker',
      html: `<div class="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    })

    // Add new driver marker
    markers.driver = (L as unknown as { marker: (latlng: [number, number], options: unknown) => { addTo: (map: unknown) => unknown; bindPopup: (text: string) => unknown } }).marker(
      [driverLocation.latitude, driverLocation.longitude],
      { icon: driverIcon }
    )
      .addTo(map)
      .bindPopup(`<b>Driver</b><br>Speed: ${driverLocation.speed || 0} km/h`)

    // Update map instance with new markers
    setMapInstance(prev => prev ? { ...prev, markers } : null)
  }, [driverLocation])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4 text-cyan-500" />
              Live Tracking
            </CardTitle>
            <CardDescription>Real-time driver location</CardDescription>
          </div>
          {driverLocation && (
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse mr-2" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="h-80 w-full bg-gray-100"
          style={{ minHeight: '320px' }}
        />
        
        {/* Driver Info */}
        {order.driver && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <Truck className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium">{order.driver.user.name}</p>
                  <p className="text-sm text-gray-500">
                    {order.driver.vehicleType} • ⭐ {order.driver.rating.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button size="sm" variant="outline">
                  <MapPin className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
