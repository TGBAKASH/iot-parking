<p align="center">
  <img src="https://img.shields.io/badge/IoT-ESP32-blue?style=for-the-badge&logo=espressif&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-Real--time-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
</p>

# 🅿️ IoT Smart Parking System

> A full-stack IoT-powered smart parking management system that uses **ESP32 microcontroller** with **IR sensors** to detect vehicle entry/exit in real-time, and displays live parking availability on a responsive web dashboard with **interactive maps** and **in-app navigation**.

🔗 **Live Demo:** [iot-parking-system.onrender.com](https://iot-parking-system.onrender.com)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Hardware Setup](#-hardware-setup)
- [Data Flow](#-data-flow)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Screenshots](#-screenshots)
- [Future Scope](#-future-scope)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Problem Statement

In urban areas, drivers waste an average of **17 minutes per trip** searching for parking, leading to:
- ⛽ Increased fuel consumption and carbon emissions
- 🚗 Traffic congestion near parking zones
- ⏱️ Loss of productive time
- 😤 Poor user experience

There is no **real-time, low-cost** system to inform drivers about parking slot availability before they arrive at a location.

---

## 💡 Solution

An end-to-end IoT-based smart parking system that:

1. **Detects** vehicles using IR sensors connected to an ESP32 microcontroller
2. **Transmits** occupancy data to a cloud server via HTTPS in real-time
3. **Displays** live slot availability on an interactive web dashboard
4. **Navigates** users to the nearest available parking with in-app route visualization
5. **Notifies** all connected users instantly via WebSocket when slot status changes

---

## ✨ Key Features

| Feature | Description |
|---------|------------|
| **Real-Time Slot Detection** | IR sensors detect vehicle entry/exit; ESP32 sends instant updates to the cloud |
| **Live Web Dashboard** | Responsive React SPA showing all parking locations with real-time availability |
| **Interactive Map** | Leaflet.js map with color-coded markers showing slot counts (🟢 Available / 🟡 Filling / 🔴 Full) |
| **In-App Navigation** | Full-page route visualization with OSRM driving directions + live slot overlay |
| **WebSocket Push Updates** | Socket.IO delivers instant UI updates to all connected browsers — no page refresh |
| **Multi-District Coverage** | 6 parking locations across different districts (Trichy, Perambalur, Madurai, Thanjavur, Karur, Dindigul) |
| **On-Site LCD Display** | 16×2 LCD at the parking entrance shows "Available: X/4" in real-time |
| **User Authentication** | JWT-based login/register with bcrypt password hashing |
| **Slot Reservation** | Users can reserve specific slots with vehicle number and duration |
| **Admin Panel** | Secret admin dashboard for managing parking locations (CRUD operations) |
| **Analytics** | Summary statistics — total parkings, total slots, occupancy rate |
| **Security** | Helmet.js, CORS, rate limiting, API key authentication for ESP32, input validation |

---

## 🏗️ System Architecture

```
┌──────────────────────┐          HTTPS POST (JSON)          ┌─────────────────────────┐
│                      │ ──────────────────────────────────→  │                         │
│   ESP32 + IR Sensors │                                     │   Express.js Server     │
│   + 16×2 LCD Display │    X-ESP32-API-KEY Authentication   │   (Node.js Backend)     │
│                      │                                     │                         │
└──────────────────────┘                                     │   ┌───────────────────┐ │
         WiFi                                                │   │   PostgreSQL DB    │ │
    (2.4 GHz)                                                │   │   (Neon Cloud)     │ │
                                                             │   └───────────────────┘ │
                                                             │                         │
                                                             │   Socket.IO Broadcast   │
                                                             │          ↓              │
                                                             └─────────────────────────┘
                                                                        │
                                                            WebSocket (Real-time Push)
                                                                        │
                                                                        ↓
                                                             ┌─────────────────────────┐
                                                             │   React.js Frontend     │
                                                             │   + Leaflet.js Maps     │
                                                             │   + OSRM Navigation     │
                                                             │   (Browser / Mobile)    │
                                                             └─────────────────────────┘
```

---

## 🛠️ Tech Stack

### Hardware
| Component | Specification |
|-----------|--------------|
| Microcontroller | ESP32 DOIT DevKit V1 (Dual-core, WiFi + BLE) |
| Entry Sensor | IR Obstacle Sensor → GPIO 32 |
| Exit Sensor | IR Obstacle Sensor → GPIO 33 |
| Display | 16×2 LCD (Parallel mode: RS=25, EN=26, D4=4, D5=17, D6=19, D7=21) |
| Libraries | `WiFi.h`, `HTTPClient.h`, `WiFiClientSecure.h`, `ArduinoJson.h`, `LiquidCrystal.h` |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express.js | REST API server |
| PostgreSQL (Neon) | Cloud-hosted relational database |
| Socket.IO | WebSocket server for real-time push updates |
| JWT + bcrypt | Authentication and password hashing |
| Helmet.js | HTTP security headers |
| express-rate-limit | API rate limiting (300 req/15 min) |
| validator.js | Input sanitization |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | Single Page Application with fast HMR |
| Tailwind CSS 3 | Utility-first CSS framework |
| Leaflet.js | Interactive map with custom markers |
| OSRM | Open Source Routing Machine (driving directions) |
| Nominatim | Reverse geocoding (coordinates → city name) |
| Socket.IO Client | Real-time WebSocket event listener |
| Axios | HTTP client for API calls |
| Lucide React | Icon library |

### DevOps
| Tool | Purpose |
|------|---------|
| Render.com | Cloud deployment (backend + frontend served as single service) |
| Neon | Serverless PostgreSQL hosting |
| GitHub | Version control and CI/CD trigger |
| Arduino IDE | ESP32 firmware development |

---

## 🔌 Hardware Setup

### Pin Configuration

```
ESP32 DOIT DevKit V1
├── GPIO 32 ──── IR Sensor 1 (ENTRY Gate)
├── GPIO 33 ──── IR Sensor 2 (EXIT Gate)
├── GPIO 25 ──── LCD RS
├── GPIO 26 ──── LCD EN
├── GPIO  4 ──── LCD D4
├── GPIO 17 ──── LCD D5
├── GPIO 19 ──── LCD D6
├── GPIO 21 ──── LCD D7
├── 5V     ──── LCD VCC + Sensors VCC
└── GND    ──── LCD GND + Sensors GND
```

### Sensor Logic
- IR sensors are **active-low**: `LOW` = car detected, `HIGH` = no car
- **Debounce flags** (`entryFlag`, `exitFlag`) prevent double-counting when a car passes slowly
- Entry detection → `carCount++` → marks next virtual slot as occupied
- Exit detection → `carCount--` → marks last occupied slot as free
- Max capacity: 4 slots (configurable via `MAX_SLOTS`)

---

## 🔄 Data Flow

```
1. IR Sensor detects car at entry gate
       ↓
2. ESP32 increments carCount (e.g., 0 → 1)
       ↓
3. ESP32 sends HTTPS POST to cloud server:
   URL:  https://iot-parking-system.onrender.com/updateParking
   Body: { "parking_id": 1, "slot_number": 1, "is_occupied": true }
   Header: X-ESP32-API-KEY: <secret_key>
       ↓
4. Express server validates API key
       ↓
5. PostgreSQL: UPSERT parking_slots + log to sensor_logs
       ↓
6. Recalculate available_slots count
       ↓
7. Socket.IO emits "parkingSlotUpdated" event
       ↓
8. All connected React frontends receive the event
       ↓
9. React re-renders: slot count updates, map markers change color,
   toast notification appears — ALL WITHOUT PAGE REFRESH
       ↓
10. LCD at parking entrance updates: "Available: 3/4"
```

**End-to-end latency: < 2 seconds**

---

## 🗄️ Database Schema

```sql
-- 5 tables with foreign key relationships

users (id, name, email, password, role, created_at)
  │
  └──→ reservations (id, user_id FK, parking_id FK, slot_number,
                      vehicle_number, duration, status, expires_at)

parkings (id, name, address, city, latitude, longitude,
          total_slots, available_slots, created_at, updated_at)
  │
  ├──→ parking_slots (id, parking_id FK, slot_number,
  │                    is_occupied, last_updated)  UNIQUE(parking_id, slot_number)
  │
  └──→ sensor_logs (id, parking_id, slot_number,
                     is_occupied, created_at)
```

### ER Diagram

```
┌──────────┐       ┌───────────────┐       ┌──────────────┐
│  users   │──1:N──│ reservations  │──N:1──│   parkings   │
└──────────┘       └───────────────┘       └──────┬───────┘
                                                  │
                                           1:N    │    1:N
                                                  │
                                    ┌─────────────┴─────────────┐
                                    │                           │
                              ┌─────┴──────┐            ┌───────┴──────┐
                              │parking_slots│            │ sensor_logs  │
                              └────────────┘            └──────────────┘
```

---

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/parkings` | Get all parking locations with slot counts |
| `GET` | `/parking/:id` | Get parking details with individual slot states |
| `GET` | `/api/health` | Health check (DB status, uptime) |

### ESP32 Endpoint (API Key Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/updateParking` | Update slot occupancy from ESP32 sensor data |

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |

### Protected Endpoints (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/createParking` | Create new parking location (Admin) |
| `PUT` | `/parking/:id` | Update parking details (Admin) |
| `DELETE` | `/parking/:id` | Delete parking location (Admin) |
| `POST` | `/api/reservations/create` | Reserve a parking slot |
| `GET` | `/api/reservations` | Get user's reservations |
| `GET` | `/api/analytics/summary` | Get system-wide analytics |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `parkingSlotUpdated` | Server → Client | Real-time slot state change broadcast |

---

## 📁 Project Structure

```
iot-parking/
│
├── hardware/                         # ESP32 Arduino firmware
│   ├── esp32_firmware/
│   │   └── esp32_firmware.ino        # Main firmware (WiFi + HTTP + LCD + IR)
│   └── lcd_pin_finder/
│       └── lcd_pin_finder.ino        # Utility to test LCD pin connections
│
├── backend/                          # Node.js Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # PostgreSQL connection pool (Neon)
│   │   ├── controllers/
│   │   │   ├── parkingController.js  # CRUD + ESP32 sensor handler
│   │   │   ├── authController.js     # Login/Register with JWT
│   │   │   ├── reservationController.js
│   │   │   └── analyticsController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # JWT verification + role check
│   │   ├── routes/
│   │   │   ├── parkingRoutes.js      # API key validation for ESP32
│   │   │   ├── authRoutes.js
│   │   │   ├── reservationRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── sockets/
│   │   │   └── socketHandler.js      # Socket.IO event handlers
│   │   ├── server.js                 # Express app + Socket.IO + static serve
│   │   └── initDb.js                 # Schema creation + seed data
│   ├── package.json
│   └── .env.example
│
├── frontend/                         # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top navigation bar
│   │   │   ├── DashboardSkeleton.jsx # Parking list with search & sort
│   │   │   ├── ParkingCardSkeleton.jsx # Individual parking card
│   │   │   ├── MapView.jsx           # Leaflet map with live markers
│   │   │   ├── NavigationView.jsx    # Full-page navigation with slot overlay
│   │   │   ├── SlotDetailsModal.jsx  # Individual slot grid inspector
│   │   │   ├── AuthModal.jsx         # Login/Register modal
│   │   │   ├── ReservationModal.jsx  # Slot reservation form
│   │   │   ├── AnalyticsModal.jsx    # System analytics dashboard
│   │   │   ├── AddParkingModal.jsx   # Admin: Add/Edit parking form
│   │   │   └── SecretAdminPanel.jsx  # Admin: Full management panel
│   │   ├── services/
│   │   │   ├── api.js                # Axios HTTP client + service methods
│   │   │   ├── socket.js            # Socket.IO client connection
│   │   │   └── routingService.js     # OSRM routing + Nominatim geocoding
│   │   ├── App.jsx                   # Root component + state management
│   │   ├── main.jsx                  # React DOM entry point
│   │   └── index.css                 # Tailwind CSS imports
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   └── schema.sql                    # Full PostgreSQL schema with indexes
│
├── package.json                      # Root package (build scripts)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org))
- **PostgreSQL** 14+ (or [Neon](https://neon.tech) free cloud DB)
- **Arduino IDE** 2.x ([Download](https://www.arduino.cc/en/software))
- **ESP32 Board Package** (via Arduino Board Manager)

### 1. Clone the Repository

```bash
git clone https://github.com/TGBAKASH/iot-parking.git
cd iot-parking
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your_jwt_secret_key
ESP32_API_KEY=default_esp32_secret_key_123
PORT=5000
```

Start the server:
```bash
npm run dev    # Development (with nodemon)
npm start      # Production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Development server (http://localhost:5173)
npm run build  # Production build (outputs to dist/)
```

### 4. ESP32 Firmware Upload

1. Open `hardware/esp32_firmware/esp32_firmware.ino` in Arduino IDE
2. Install required libraries: `ArduinoJson`, `LiquidCrystal`
3. Update WiFi credentials and server URL in the code
4. Select board: **DOIT ESP32 DEVKIT V1**
5. Upload and monitor via Serial (115200 baud)

### 5. Production Deployment

The project is configured for **Render.com** single-service deployment:
- Backend serves the frontend static build from `frontend/dist/`
- Set `DATABASE_URL` environment variable on Render
- Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
- Start command: `cd backend && npm start`

---

## 📸 Screenshots

> _Add screenshots of your deployed application here_

| Dashboard | Map View | Navigation |
|-----------|----------|------------|
| Parking cards with live slot counts | Interactive map with color-coded markers | Full-page route with slot overlay |

---

## 🔮 Future Scope

- [ ] **Camera-based detection** using YOLO/OpenCV for license plate recognition
- [ ] **Mobile app** (React Native) with push notifications
- [ ] **Payment gateway** integration for paid parking
- [ ] **Predictive analytics** using ML to forecast peak occupancy hours
- [ ] **Multi-floor parking** support with level-wise slot mapping
- [ ] **QR code-based entry** for pre-reserved slots
- [ ] **MQTT protocol** as alternative to HTTPS for lower latency

---

## 🧑‍💻 Author

**Akash T G**

- GitHub: [@TGBAKASH](https://github.com/TGBAKASH)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>⭐ If you found this project useful, consider giving it a star!</b>
</p>
