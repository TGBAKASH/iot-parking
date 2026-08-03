# Smart Parking System - Full Stack IoT Solution

A production-grade, real-time IoT Smart Parking System built with **React (Vite, Tailwind CSS, Google Maps API)** on the frontend, **Node.js (Express.js, Socket.IO, PostgreSQL)** on the backend, and **ESP32 + IR Sensors** hardware integration.

---

## 📁 Project Directory & File Explanations (Requirement #15)

```
iot parking/
├── database/
│   └── schema.sql                 # PostgreSQL database tables (users, parkings, parking_slots)
├── backend/
│   ├── package.json               # Node.js dependencies & scripts (Express, Socket.IO, pg, CORS)
│   ├── .env.example               # Template for backend environment variables (DB host, PORT, JWT secret)
│   └── src/
│       ├── server.js              # Express app entrypoint, Socket.IO server init, & health endpoint
│       ├── config/
│       │   └── db.js              # PostgreSQL database connection pool setup using 'pg' module
│       ├── controllers/
│       │   ├── authController.js  # Registration and login logic with bcrypt and JWT tokens
│       │   └── parkingController.js # Handles REST APIs (GET, POST, PUT, DELETE) and ESP32 hook + Socket.IO emit
│       ├── routes/
│       │   ├── authRoutes.js      # Endpoint router for /api/auth/register and /api/auth/login
│       │   └── parkingRoutes.js   # Endpoint router for /parkings, /parking/:id, /createParking, /updateParking
│       └── sockets/
│           └── socketHandler.js   # Socket.IO client connection, disconnection, and room lifecycle manager
├── frontend/
│   ├── package.json               # React dependencies & build scripts (Vite, Tailwind CSS, Lucide, Socket.IO client)
│   ├── vite.config.js             # Vite configuration with proxy for backend API & WebSockets
│   ├── tailwind.config.js         # Custom colors, theme extension, and glassmorphism styling
│   ├── postcss.config.js          # PostCSS configuration for Tailwind CSS compilation
│   ├── index.html                 # HTML application template with Google Inter font
│   ├── .env.example               # Template for frontend environment variables (Google Maps API key, API URL)
│   └── src/
│       ├── main.jsx               # React DOM root entry script
│       ├── index.css              # Glassmorphism utilities, dark mode CSS, and animation Keyframes
│       ├── App.jsx                # Main React container connecting dashboard state & WebSockets listeners
│       ├── services/
│       │   ├── api.js             # Axios client wrapper for all backend REST API routes
│       │   └── socket.js          # Socket.IO client instance and event subscriber utilities
│       └── components/
│           ├── Navbar.jsx         # Sticky application header with live WebSockets status badge
│           ├── MapSkeleton.jsx    # Visual placeholder container for Google Maps API integration
│           ├── ParkingCardSkeleton.jsx # Parking location card with slot counters and test simulation buttons
│           └── DashboardSkeleton.jsx   # Search bar and parking location grid layout manager
└── README.md                      # Project documentation, file explanations, and step-by-step setup guide
```

---

## 🚀 Step-by-Step Instructions to Run Locally (Requirement #16)

### Prerequisites
- **Node.js** (v18.x or higher) installed on your system.
- **PostgreSQL** (v14.x or higher) installed and running locally, OR a cloud PostgreSQL instance (e.g. Supabase, Render PostgreSQL).

---

### Step 1: Database Setup
1. Open PostgreSQL terminal (`psql`) or a database tool like pgAdmin / DBeaver.
2. Create a new database named `smart_parking_db`:
   ```sql
   CREATE DATABASE smart_parking_db;
   ```
3. Execute the SQL script in `database/schema.sql`:
   ```bash
   psql -U postgres -d smart_parking_db -f database/schema.sql
   ```

---

### Step 2: Backend Setup & Execution
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set your credentials:
   ```bash
   cp .env.example .env
   ```
   *(Ensure DB_USER, DB_PASSWORD, and DB_NAME match your local PostgreSQL setup).*
4. Start the Node.js backend server:
   ```bash
   npm run dev
   ```
   *(You should see `🚀 Smart Parking System Backend is running on port 5000`)*.

---

### Step 3: Frontend Setup & Execution
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install React dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## ⚡ Testing Real-Time WebSockets & ESP32 Hook (Milestone 1)

1. When you open `http://localhost:5173`, observe the green **"Live WebSockets"** badge in the top right navbar.
2. Click **"Occupy Slot 1"** on any parking card.
3. The frontend sends an HTTP `POST /updateParking` request to the backend.
4. The backend updates the slot status and emits a `parkingSlotUpdated` Socket.IO event.
5. All connected frontend browser tabs update instantly without refreshing the page!

---

## 📌 Milestone Roadmap
- [x] **Milestone 1**: Project Setup, Database Schema, Backend & Frontend Skeletons, File Explanations & Local Setup Guide.
- [ ] **Milestone 2**: Database Integration, Authentication, Complete REST APIs, & ESP32 HTTP POST Hook.
- [ ] **Milestone 3**: Google Maps JS API, Routes API Distance Matrix, Search Box, Real-Time Map Markers & Popups.
- [ ] **Milestone 4**: ESP32 C++ Firmware, Render Deployment Guide & Google Maps API Key Guide.
