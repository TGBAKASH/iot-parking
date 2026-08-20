# 🎓 IoT Smart Parking System — Viva Preparation Guide

> **Memorize these answers. Your mentor will ask questions from these areas.**

---

## 🔹 1. PROJECT OVERVIEW

**Q: What is your project?**
> It's an **IoT-based Smart Parking System** that uses ESP32 microcontroller with IR sensors to detect vehicle entry/exit in real-time, updates a cloud-hosted web dashboard, and helps users find nearby available parking using a map interface.

**Q: What problem does it solve?**
> In urban areas, drivers waste time circling for parking. Our system provides **real-time parking availability** on a website — users can see how many slots are free before they drive there. The IoT sensors eliminate manual counting.

**Q: What makes it different from existing solutions?**
> - Uses **low-cost IoT hardware** (ESP32 + IR sensors) instead of expensive camera systems
> - **Real-time updates** via WebSockets — no page refresh needed
> - **No app installation required** — works on any browser (mobile + desktop)
> - Fully **cloud-deployed** — accessible from anywhere

---

## 🔹 2. TECH STACK

**Q: What tech stack did you use?**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Hardware** | ESP32 (DOIT DevKit V1) | Microcontroller with built-in WiFi |
| **Sensors** | 2× IR Obstacle Sensors | Detect vehicle entry & exit |
| **Display** | 16×2 LCD (Parallel mode) | Show available slots at the parking site |
| **Frontend** | React.js + Vite | Single Page Application (SPA) |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | PostgreSQL (Neon Cloud) | Relational database for parking data |
| **Real-time** | Socket.IO (WebSocket) | Push instant updates to all connected browsers |
| **Maps** | Leaflet.js + OpenStreetMap | Interactive map with parking markers |
| **Routing** | OSRM (Open Source Routing Machine) | Calculate driving distance & time |
| **Geocoding** | Nominatim (OpenStreetMap) | Convert coordinates ↔ city/area names |
| **Hosting** | Render.com | Cloud deployment (backend + frontend) |
| **Version Control** | Git + GitHub | Source code management |

**Q: Why ESP32 and not Arduino?**
> ESP32 has **built-in WiFi and Bluetooth**, dual-core processor, and is cheaper than Arduino + WiFi shield combo. It directly connects to the internet without any additional module.

**Q: Why PostgreSQL and not MySQL or MongoDB?**
> PostgreSQL is a robust relational database that supports complex queries. We use **relational data** — parkings have many slots, slots have states — so a relational DB is the natural fit. We chose Neon Cloud which gives a **free hosted PostgreSQL** instance.

**Q: Why React and not plain HTML/JS?**
> React provides **component-based architecture** and efficient **state management**. When sensor data changes, React automatically re-renders only the affected components, giving a smooth real-time experience.

**Q: Why Socket.IO instead of polling?**
> HTTP polling wastes bandwidth by constantly asking "any updates?" every few seconds. **Socket.IO uses WebSockets** — the server *pushes* updates instantly when a sensor detects a change. This is more efficient and provides **sub-second latency**.

---

## 🔹 3. HARDWARE DETAILS

**Q: What IoT devices did you use?**
> 1. **ESP32 DOIT DevKit V1** — Microcontroller
> 2. **2× IR Obstacle Sensors** — One for entry gate, one for exit gate
> 3. **16×2 LCD Display** (Parallel mode) — Shows slot availability on-site
> 4. **Jumper wires + Breadboard** — For connections

**Q: What are the pin connections?**

| Component | Pin | ESP32 GPIO |
|-----------|-----|-----------|
| IR Entry Sensor | OUT | **GPIO 32** |
| IR Exit Sensor | OUT | **GPIO 33** |
| LCD RS | - | **GPIO 25** |
| LCD EN | - | **GPIO 26** |
| LCD D4 | - | **GPIO 4** |
| LCD D5 | - | **GPIO 17** |
| LCD D6 | - | **GPIO 19** |
| LCD D7 | - | **GPIO 21** |

**Q: How do the IR sensors work?**
> IR sensors emit infrared light. When an object (car) is in front, the light reflects back and the sensor outputs **LOW (0)**. When no object, it outputs **HIGH (1)**. We use this active-low signal to detect vehicles.

**Q: Why only 2 sensors? How do you track individual slots?**
> We use the **entry/exit counter model**:
> - Entry sensor detects → `carCount++` → mark next virtual slot as occupied
> - Exit sensor detects → `carCount--` → mark last occupied slot as free
> 
> This maps a simple counter to 4 virtual slots. For example, if `carCount = 3`, slots 1-3 are occupied and slot 4 is free. This is more cost-effective than putting a sensor on every slot.

**Q: How do you prevent double-counting?**
> We use **debounce flags** (`entryFlag`, `exitFlag`). When the sensor first detects LOW (car present), we set the flag and process the event. We don't process again until the sensor goes HIGH (car passes completely) and the flag resets.

**Q: What does the LCD show?**
> ```
> Smart Parking
> Available: 3/4
> ```
> It shows the parking name and available slots out of total. When the parking is full, it shows "PARKING FULL! No Space Left".

---

## 🔹 4. CONNECTIVITY & DATA FLOW

**Q: How does the ESP32 connect to the internet?**
> The ESP32 connects to a **WiFi hotspot** using the `WiFi.h` library. Once connected, it gets an IP address and can make HTTP requests to our cloud server.

**Q: Explain the complete data flow from sensor to website.**

```
IR Sensor detects car → ESP32 reads GPIO pin (LOW)
    ↓
ESP32 increments/decrements carCount
    ↓
ESP32 sends HTTP POST to backend:
    URL: https://iot-parking-system.onrender.com/updateParking
    Body: { parking_id: 1, slot_number: 3, is_occupied: true }
    Header: X-ESP32-API-KEY: <secret_key>
    ↓
Backend receives request → validates API key
    ↓
Updates PostgreSQL database (parking_slots table)
    ↓
Recalculates available_slots count
    ↓
Emits Socket.IO event: "parkingSlotUpdated"
    ↓
All connected browsers receive the event instantly
    ↓
React frontend updates the UI (slot count, map marker, toast notification)
```

**Q: What protocol does the ESP32 use to send data?**
> **HTTPS (HTTP over TLS/SSL)** — We use `WiFiClientSecure` with `client.setInsecure()` for the SSL connection to Render's HTTPS endpoint. The data is sent as a **JSON payload via POST request**.

**Q: How is the ESP32 authenticated?**
> We use an **API key** sent in the HTTP header (`X-ESP32-API-KEY`). The backend validates this key before accepting any sensor data. This prevents unauthorized devices from modifying parking data.

**Q: What happens if WiFi disconnects?**
> The `loop()` function checks WiFi status on every iteration. If disconnected, it calls `connectToWiFi()` to reconnect. The LCD shows "WiFi Connecting..." during this process.

---

## 🔹 5. BACKEND & DATABASE

**Q: Explain your database schema.**
> We have 5 tables:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `parkings` | Parking locations | id, name, address, city, latitude, longitude, total_slots, available_slots |
| `parking_slots` | Individual slot states | parking_id (FK), slot_number, is_occupied, last_updated |
| `users` | User accounts | id, name, email, password (hashed), role |
| `sensor_logs` | Telemetry history | parking_id, slot_number, is_occupied, created_at |
| `reservations` | Slot reservations | user_id, parking_id, slot_number, vehicle_number, duration |

**Q: How does the backend process sensor data?**
> The `updateParkingFromESP32` controller:
> 1. Validates the API key from header
> 2. **Upserts** the slot state using `INSERT ... ON CONFLICT DO UPDATE` (creates if new, updates if exists)
> 3. Logs the event in `sensor_logs` for history
> 4. Recalculates `available_slots` by counting free slots
> 5. Updates the `parkings` table
> 6. Emits `parkingSlotUpdated` event via Socket.IO

**Q: What security measures are in the backend?**
> - **Helmet.js** — Sets secure HTTP headers
> - **Rate Limiting** — Max 300 requests per 15 minutes per IP
> - **CORS** — Restricts cross-origin access
> - **API Key validation** — For ESP32 endpoints
> - **JWT (JSON Web Tokens)** — For user authentication
> - **bcrypt** — Password hashing
> - **Input validation** — Using `validator.js` library
> - **Payload size limit** — 10KB max request body

---

## 🔹 6. FRONTEND & MAPS

**Q: How does the map work?**
> We use **Leaflet.js** with **OpenStreetMap tiles** (free, no API key needed). Parking locations are shown as colored circle markers:
> - 🟢 Green = >40% slots available
> - 🟡 Yellow = 15-40% available  
> - 🔴 Red = <15% available
> 
> The user's location is shown as a blue pulsing dot. The map auto-fits to show all markers.

**Q: How do you calculate distance and travel time?**
> We use **OSRM (Open Source Routing Machine)** — a free routing engine. It calculates actual **road driving distance** (not straight-line), along with estimated travel time. If OSRM fails, we fall back to **Haversine formula** for straight-line distance.

**Q: How does real-time update work on the website?**
> The frontend establishes a **WebSocket connection** via Socket.IO. When the backend receives sensor data from ESP32, it emits a `parkingSlotUpdated` event. All connected browsers receive this event and React **automatically re-renders** the affected components — updating slot counts, map markers, and showing a toast notification.

**Q: How does location detection work?**
> 1. First tries **browser's Geolocation API** (GPS on mobile, WiFi triangulation on desktop)
> 2. If the detected location is >100km from Trichy, defaults to Trichy coordinates
> 3. Uses **Nominatim reverse geocoding** to convert coordinates into a readable city/area name
> 4. The Navigate button uses **Google Maps Directions** with explicit origin and destination

---

## 🔹 7. DEPLOYMENT & ARCHITECTURE

**Q: Where is the project deployed?**
> On **Render.com** (free tier). It serves both the backend API and the React frontend as a single service. The database is hosted on **Neon** (cloud PostgreSQL).

**Q: Explain the system architecture.**

```
┌──────────────┐     HTTPS POST      ┌──────────────────┐
│   ESP32      │ ──────────────────→  │  Express.js      │
│  + IR Sensors│                      │  Backend Server   │
│  + LCD       │                      │  (Render.com)     │
└──────────────┘                      │                   │
                                      │  ┌──────────────┐ │
                                      │  │ PostgreSQL   │ │
                                      │  │ (Neon Cloud)  │ │
                                      │  └──────────────┘ │
                                      │                   │
                                      │  Socket.IO ↓      │
┌──────────────┐     WebSocket        │                   │
│  React.js    │ ←────────────────    │                   │
│  Frontend    │     (real-time)      └──────────────────┘
│  (Browser)   │
│  + Leaflet   │
│  + Maps      │
└──────────────┘
```

**Q: How does the frontend build work?**
> We use **Vite** as the build tool. Running `npm run build` compiles React JSX and Tailwind CSS into optimized static files (`dist/`). The Express backend serves these static files in production, so both frontend and backend run on the **same port**.

---

## 🔹 8. WORKFLOW SUMMARY

**Q: Walk me through the user workflow.**
> 1. User opens the website on their phone/laptop
> 2. Website detects their GPS location (defaults to Trichy)
> 3. Shows **2 nearby parking locations** with real-time availability
> 4. User sees distance and drive time to each parking (via OSRM)
> 5. The **nearest parking** is highlighted with a ⭐ badge
> 6. The **IoT-connected parking** shows a 📶 "IoT Live" badge
> 7. User clicks **"Navigate"** → opens Google Maps with driving directions
> 8. At the parking site, the **16×2 LCD** shows available slots
> 9. When cars enter/exit, the website updates **in real-time** (no refresh)

---

## 🔹 9. CHALLENGES & SOLUTIONS

**Q: What challenges did you face?**

| Challenge | Solution |
|-----------|----------|
| LCD not working with I2C | Switched to **parallel mode** (6 data pins) after testing |
| Sensor pins conflicting with LCD | Moved sensors to **GPIO 32 & 33** (ADC-only pins) |
| Browser GPS returning wrong city | **Hardcoded Trichy fallback** if GPS is >100km off |
| Google Maps showing wrong route | Added **explicit origin + destination** in Navigate URL |
| HTTPS from ESP32 | Used `WiFiClientSecure` with `setInsecure()` for SSL bypass |
| Free hosting limitations | Used **Render.com** (free) + **Neon** (free PostgreSQL) |

---

## 🔹 10. QUICK-FIRE ANSWERS

| Question | Answer |
|----------|--------|
| **Programming languages?** | C++ (ESP32), JavaScript (Frontend + Backend) |
| **IDE used?** | Arduino IDE (hardware), VS Code (web) |
| **Frontend framework?** | React.js 18 with Vite build tool |
| **CSS framework?** | Tailwind CSS v3 |
| **Backend framework?** | Express.js (Node.js) |
| **Database?** | PostgreSQL on Neon Cloud |
| **Real-time protocol?** | WebSocket via Socket.IO |
| **Map library?** | Leaflet.js with OpenStreetMap tiles |
| **Routing API?** | OSRM (Open Source Routing Machine) |
| **Geocoding?** | Nominatim (OpenStreetMap) |
| **ESP32 communication?** | HTTPS POST (JSON payload) |
| **Authentication?** | JWT (JSON Web Tokens) + bcrypt |
| **Hosting platform?** | Render.com |
| **Version control?** | Git + GitHub |
| **Total sensors?** | 2 (one entry, one exit) |
| **Total parking slots?** | 4 (virtual, mapped from counter) |
| **LCD type?** | 16×2 character LCD (parallel mode) |
| **Baud rate?** | 115200 |
| **WiFi library?** | WiFi.h + WiFiClientSecure |
| **JSON library?** | ArduinoJson |

---

> [!TIP]
> **Pro tip for the viva**: When answering, always connect the hardware to the software. For example: "The IR sensor detects a car, the ESP32 processes it, sends HTTPS to our Express server, which updates PostgreSQL, emits via Socket.IO, and React instantly re-renders the UI."
