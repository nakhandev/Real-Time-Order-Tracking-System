# 🚚 DeliverNow - Real-Time Order Tracking System

A production-ready delivery tracking application with real-time GPS tracking, live order status updates, and driver management. Built with Next.js, Socket.io, and Prisma.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?style=flat-square&logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🎯 Core Functionality
- **Order Management** - Create, track, and manage delivery orders
- **Real-Time Tracking** - Live GPS location updates on interactive maps
- **Driver Dashboard** - Driver availability, order assignment, earnings tracking
- **Notification System** - Instant alerts for order status changes
- **Status Timeline** - Visual progress tracking from order to delivery

### 🗺️ Real-Time Capabilities
- WebSocket-based bi-directional communication
- Room-based order tracking (customers join specific order rooms)
- Driver location broadcasting with speed and heading data
- Live order status updates pushed to all connected clients
- Automatic reconnection handling

### 🎨 User Interface
- Responsive design (mobile-first)
- Dark/Light theme support
- Interactive maps with custom markers
- Real-time status badges and indicators
- Toast notifications for important events

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Orders    │  │  New Order  │  │   Live Map Tracking     │  │
│  │    List     │  │    Form     │  │   (Leaflet + Socket)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Notifications│  │   Driver   │  │   Order Status          │  │
│  │    Panel    │  │  Dashboard  │  │     Timeline            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Caddy)                       │
│                    Port 3000 (Main) + 3003 (WS)                  │
└─────────────────────────────────────────────────────────────────┘
          │                                        │
          ▼                                        ▼
┌──────────────────────┐              ┌──────────────────────────┐
│   NEXT.JS SERVER     │              │   SOCKET.IO SERVICE      │
│    (Port 3000)       │              │     (Port 3003)          │
│                      │              │                          │
│  ┌────────────────┐  │              │  ┌────────────────────┐  │
│  │  API Routes    │  │              │  │  Driver Events     │  │
│  │  /api/orders   │  │              │  │  • online/offline  │  │
│  │  /api/drivers  │  │              │  │  • location        │  │
│  │  /api/users    │  │              │  │  • accept-order    │  │
│  │  /api/locations│  │              │  ├────────────────────┤  │
│  └────────────────┘  │              │  │  Customer Events   │  │
│  ┌────────────────┐  │              │  │  • track-order     │  │
│  │  Prisma ORM    │  │              │  │  • stop-tracking   │  │
│  └────────────────┘  │              │  ├────────────────────┤  │
│          │           │              │  │  Order Events      │  │
│          ▼           │              │  │  • status-update   │  │
│  ┌────────────────┐  │              │  │  • new-order       │  │
│  │   SQLite DB    │  │              │  └────────────────────┘  │
│  │  (Prisma)      │  │              │                          │
│  └────────────────┘  │              └──────────────────────────┘
└──────────────────────┘
```

---

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  phone     String?
  role      String   // customer, driver, admin
  orders    Order[]
  drivers   Driver[]
}

model Driver {
  id              String     @id @default(cuid())
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  vehicleType     String     // car, motorcycle, bicycle
  vehiclePlate    String?
  isActive        Boolean    @default(false)
  isAvailable     Boolean    @default(true)
  rating          Float      @default(5.0)
  totalDeliveries Int        @default(0)
  currentLat      Float?
  currentLng      Float?
  orders          Order[]
  locations       Location[]
}

model Order {
  id              String   @id @default(cuid())
  orderNumber     String   @unique
  customerId      String
  customer        User     @relation(fields: [customerId], references: [id])
  driverId        String?
  driver          Driver?  @relation(fields: [driverId], references: [id])
  
  pickupAddress   String
  pickupLat       Float?
  pickupLng       Float?
  deliveryAddress String
  deliveryLat     Float?
  deliveryLng     Float?
  
  items           String   // JSON
  totalAmount     Float
  deliveryFee     Float
  notes           String?
  
  status          String   @default("pending")
  // pending, confirmed, preparing, picked_up, in_transit, delivered, cancelled
  
  estimatedTime   Int?
  locations       Location[]
  notifications   Notification[]
}

model Location {
  id          String   @id @default(cuid())
  orderId     String?
  order       Order?   @relation(fields: [orderId], references: [id])
  driverId    String
  driver      Driver   @relation(fields: [driverId], references: [id])
  latitude    Float
  longitude   Float
  speed       Float?
  heading     Float?
  timestamp   DateTime @default(now())
}

model Notification {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  type        String
  title       String
  message     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Bun (recommended) or npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd my-project

# Install dependencies
bun install

# Setup database
bun run db:push

# Start development server
bun run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./db/custom.db"
```

---

## 📡 API Documentation

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Get all orders (filterable) |
| `GET` | `/api/orders/:id` | Get single order with details |
| `POST` | `/api/orders` | Create new order |
| `PUT` | `/api/orders/:id` | Update order status/assign driver |
| `DELETE` | `/api/orders/:id` | Delete order |

**Query Parameters (GET /api/orders):**
- `customerId` - Filter by customer
- `driverId` - Filter by driver
- `status` - Filter by status
- `orderNumber` - Search by order number

**Example Request (Create Order):**
```json
{
  "customerId": "clx123...",
  "pickupAddress": "123 Restaurant Ave, New York, NY",
  "pickupLat": 40.7580,
  "pickupLng": -73.9855,
  "deliveryAddress": "456 Customer St, New York, NY",
  "deliveryLat": 40.7484,
  "deliveryLng": -73.9857,
  "items": [
    { "name": "Burger Deluxe", "quantity": 2, "price": 12.99 }
  ],
  "deliveryFee": 5.99
}
```

### Drivers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/drivers` | Get all drivers |
| `GET` | `/api/drivers/:id` | Get single driver |
| `POST` | `/api/drivers` | Create new driver |
| `PUT` | `/api/drivers/:id` | Update driver location/availability |

**Query Parameters (GET /api/drivers):**
- `available=true/false` - Filter by availability
- `active=true/false` - Filter by active status

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/locations` | Get locations (filterable) |
| `POST` | `/api/locations` | Create location update |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | Get all users |
| `POST` | `/api/users` | Create new user |

### Seed

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/seed` | Populate database with sample data |

---

## 🔌 WebSocket Events

### Connection

```javascript
import { io } from 'socket.io-client'

const socket = io('/?XTransformPort=3003', {
  transports: ['websocket', 'polling']
})
```

### Driver Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `driver:online` | Emit | `{ driverId: string }` | Driver goes online |
| `driver:offline` | Emit | `{ driverId: string }` | Driver goes offline |
| `driver:location` | Emit | `{ driverId, latitude, longitude, speed?, heading? }` | Location update |
| `driver:accept-order` | Emit | `{ orderId, driverId }` | Accept delivery |
| `driver:new-order` | Receive | `{ orderId, pickup, delivery }` | New order notification |

### Customer Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `customer:track-order` | Emit | `{ orderId, customerId }` | Start tracking |
| `customer:stop-tracking` | Emit | `{ orderId, customerId }` | Stop tracking |
| `location:update` | Receive | `{ driverId, latitude, longitude, speed, heading }` | Driver location |
| `order:status` | Receive | `{ orderId, status, message }` | Status update |
| `order:delivered` | Receive | `{ orderId }` | Order delivered |

### Notification Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `notification:new` | Receive | `Notification` | New notification |
| `notification:send` | Emit | `{ customerId, notification }` | Send to customer |
| `notification:order` | Emit | `{ orderId, notification }` | Send to order room |

---

## 📱 Order Status Flow

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ PENDING  │───▶│ CONFIRMED │───▶│ PREPARING │───▶│ PICKED_UP │
└──────────┘    └───────────┘    └───────────┘    └───────────┘
                                                        │
                                                        ▼
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│CANCELLED │◀───│           │◀───│           │◀───│IN_TRANSIT │
└──────────┘    └───────────┘    └───────────┘    └───────────┘
                                                        │
                                                        ▼
                                                  ┌───────────┐
                                                  │ DELIVERED │
                                                  └───────────┘
```

---

## 🎯 Usage Guide

### As a Customer

1. **View Orders** - See all your orders with status badges
2. **Place New Order** - Select pickup/delivery locations, add items
3. **Track Delivery** - Watch driver location in real-time on map
4. **Get Notifications** - Receive instant status updates

### As a Driver

1. **Go Online** - Toggle availability in Driver Dashboard
2. **Accept Orders** - View pending orders and accept deliveries
3. **Navigate** - Use map integration for directions
4. **Complete Deliveries** - Mark orders as delivered

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | SQLite + Prisma ORM |
| **Real-time** | Socket.io |
| **Maps** | Leaflet + React-Leaflet |
| **State** | React useState + useCallback |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
my-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── orders/
│   │   │   │   ├── route.ts          # GET all, POST create
│   │   │   │   └── [id]/route.ts     # GET/PUT/DELETE single
│   │   │   ├── drivers/
│   │   │   ├── locations/
│   │   │   ├── users/
│   │   │   └── seed/route.ts         # Sample data generator
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Main application
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── order-placement-form.tsx
│   │   ├── order-tracking-map.tsx
│   │   ├── order-status-tracker.tsx
│   │   ├── orders-list.tsx
│   │   ├── notifications-panel.tsx
│   │   └── driver-dashboard.tsx
│   ├── hooks/
│   └── lib/
│       ├── db.ts                     # Prisma client
│       └── utils.ts
├── mini-services/
│   └── tracking-service/
│       ├── index.ts                  # Socket.io server
│       └── package.json
├── prisma/
│   └── schema.prisma                 # Database schema
├── db/
│   └── custom.db                     # SQLite database
└── package.json
```

---

## 🔒 Security Considerations

- Input validation on all API endpoints
- Type-safe database queries with Prisma
- CORS configured for secure origins
- No sensitive data exposed in WebSocket events
- SQL injection protection via Prisma parameterized queries

---

## 🚧 Future Enhancements

- [ ] User authentication (NextAuth.js)
- [ ] Push notifications (Web Push API)
- [ ] Payment integration (Stripe)
- [ ] Estimated delivery time calculation
- [ ] Multi-stop route optimization
- [ ] Driver mobile app (React Native)
- [ ] Admin dashboard with analytics
- [ ] Customer reviews and ratings
- [ ] Promo codes and discounts

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For support, please open an issue in the repository.

---

<p align="center">
  Built with ❤️ using Next.js, Socket.io, and Prisma
</p>
