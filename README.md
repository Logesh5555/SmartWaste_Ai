# EcoNexa — Intelligent Waste Prediction and Monitoring System

[![Node.js Version](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![React Version](https://img.shields.io/badge/React-19.2+-61dafb.svg)](https://react.dev/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.3+-orange.svg)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade, modern, and responsive web application engineered for municipal authorities, monitoring officers, and waste collection staff. EcoNexa integrates real-time IoT sensor telemetry, multi-horizon Scikit-Learn machine learning predictions, and Nearest-Neighbor Traveling Salesperson Problem (TSP) collection route optimization.

---

## 1. System Architecture

```
                          ┌──────────────────────────────────────────────┐
                          │         React 18 + Vite + Tailwind UI        │
                          │   Leaflet Maps | Recharts | Socket.io Client │
                          └──────────────────────┬───────────────────────┘
                                                 │ REST & WebSocket
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │         Node.js + Express.js API             │
                          │ JWT Auth | RBAC | Socket.io | Simulator Svc  │
                          │ Heuristic TSP Route Optimizer | Data Store   │
                          └───────┬───────────────────────────────┬──────┘
                                  │                               │
                 Mongoose / Atlas │                               │ HTTP Predict
                                  ▼                               ▼
                     ┌───────────────────────┐       ┌───────────────────────┐
                     │     MongoDB Atlas     │       │   Python ML Service   │
                     │  7 Collections + Indx │       │ FastAPI + Scikit-Learn│
                     │  InMemory Fallback    │       │ Random Forest (joblib)│
                     └───────────────────────┘       └───────────────────────┘
```

---

## 2. Key Modules & Features

### 👤 Role-Based Access Control (RBAC)
- **Municipal Administrator**: Full system oversight, fleet CRUD, TSP routing dispatch, alert resolution, user management, and CSV report export.
- **Municipal Staff**: Dedicated mobile-first operations portal, assigned route stops, route start/completion with collected weight (kg), automatic bin level reset, and damaged bin reporting.
- **Monitoring Officer**: Real-time fill telemetry oversight, ML forecasts, ward-level accumulation analytics, and active alert monitoring.

### 📊 Main Administrator Dashboard & Real-Time KPIs
- 8 Real-Time KPI Cards: Total Bins, Normal (<60%), Nearing Capacity (60–80%), Overflowing (≥80%), Scheduled Today, Pending Tasks, Average Fill %, and Predicted Overflows (next 12h).
- Interactive Recharts Visualizations: Waste generation trends, weekly collected tonnage, actual vs. ML predicted fill levels, ward utilization bar charts, and category breakdown.

### 🗑️ Complete Bin Fleet Management
- CRUD operations for bins with GPS coordinates (`[lng, lat]`), wards, waste stream categories (`general`, `recyclable`, `organic`, `hazardous`), and capacity (liters).
- Search, filter by ward, category, and status, and sort by fill percentage.
- Detailed Bin Telemetry View with historical fill area charts and raw sensor logs.

### 📡 Real-Time Telemetry & IoT Sensor Simulator
- Built-in background simulator that generates realistic diurnal random-walk fill level changes.
- Automatically transitions bin statuses and dispatches deduplicated alerts upon crossing critical 80% thresholds.
- Hardware IoT Ingestion API endpoint (`POST /api/monitoring/sensor-reading`) authenticated via `x-api-key`.

### 🧠 Scikit-Learn AI Prediction Engine
- Trained `MultiOutputRegressor(RandomForestRegressor)` pipeline predicting fill levels at **+6h, +12h, and +24h horizons**.
- Piecewise linear interpolation and slope extrapolation to calculate **estimated time to overflow** (hours).
- Verified Test Set Performance:
  - **MAE**: $1.65\%$
  - **RMSE**: $2.35\%$
  - **$R^2$ Score**: $0.9887$
- Robust analytical heuristic filling-rate fallback if the ML microservice is disconnected.

### 🗺️ Intelligent Route Scheduling (Nearest-Neighbor TSP)
- Geospatial collection route optimizer that sequences candidate bins to minimize total travel distance and driving duration.
- Quantified sustainability metrics: Fuel saved (liters), $\text{CO}_2$ emissions avoided (kg), and financial cost savings (₹ / $).
- Interactive Route Map rendered with Leaflet, waypoint sequence markers, and depot return polyline.

### 🚨 Incident Center & Alerts
- Active and resolved incident tabs, severity filtering (`critical`, `high`, `medium`, `low`), and one-click resolution.
- Live alert toasts and top banner notifications delivered via Socket.IO.

### 📈 Analytics & CSV Export
- Detailed reports filterable by ward and category.
- Streaming CSV exports for Bins Fleet, Collection Tasks, and Raw Telemetry Logs.

---

## 3. Technology Stack

- **Frontend**: React 19 / 18, Vite, Tailwind CSS, Lucide React, Recharts, Leaflet & React-Leaflet, Axios, Socket.io-client.
- **Backend**: Node.js 24, Express.js, Socket.IO, JWT, bcryptjs, json2csv, Mongoose.
- **Database**: MongoDB Atlas with high-fidelity In-Memory Mock Store fallback (seamless offline demo mode).
- **AI/ML Service**: Python 3.12, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib.

---

## 4. One-Click Demo Credentials

When logging in, click any of the **Quick Demo Role** buttons or use:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@econexa.city` | `password123` |
| **Municipal Staff** | `staff@econexa.city` | `password123` |
| **Monitoring Officer** | `officer@econexa.city` | `password123` |

---

## 5. Quickstart Guide (Local Setup)

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+)

### Step 1: Install Dependencies & Prepare Machine Learning Model
```bash
# 1. Train Scikit-Learn Model & Generate Joblib Artifact
cd ml_service
python model_trainer.py
cd ..

# 2. Install Backend Dependencies
cd backend
npm install
cd ..

# 3. Install Frontend Dependencies
cd frontend
npm install --legacy-peer-deps
cd ..
```

### Step 2: Run the Automated Integration Tests
```bash
cd backend
npm test
cd ..
```

### Step 3: Launch All Services

#### On Windows:
Double-click `start.bat` or run:
```powershell
.\start.ps1
```

#### Or Run Each Tier Manually:
```bash
# Terminal 1: Python FastAPI ML Microservice (Port 5001)
cd ml_service
python -m uvicorn app:app --port 5001 --reload

# Terminal 2: Node.js Express Backend & Socket.IO (Port 5000)
cd backend
npm run dev

# Terminal 3: React Vite Frontend (Port 5173)
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 6. Project Directory Layout

```
SmartWaste_Ai/
├── backend/
│   ├── src/
│   │   ├── config/ (db.js, config.js)
│   │   ├── models/ (User, Bin, FillLog, Prediction, CollectionTask, Alert, ActivityLog, dataRepository)
│   │   ├── middleware/ (auth, roleCheck, errorHandler)
│   │   ├── controllers/ (auth, bin, monitoring, prediction, collection, alert, analytics, user)
│   │   ├── routes/ (auth, bin, monitoring, prediction, collection, alert, analytics, user)
│   │   ├── services/ (socketService, simulatorService, routeOptimizationService, mlClientService)
│   │   ├── seed/ (sampleData.js, seeder.js)
│   │   └── server.js
│   ├── tests/ (api.test.js)
│   ├── .env.example
│   └── package.json
├── ml_service/
│   ├── app.py (FastAPI service)
│   ├── model_trainer.py (Random Forest trainer with cross-validation & evaluation metrics)
│   ├── data_generator.py (Time-aware municipal waste generation dataset synthesis)
│   ├── trained_model/ (waste_prediction_rf.joblib, metadata.json)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/ (Navbar, Sidebar, MetricCard, Modal, AlertBanner, LoadingSkeleton)
│   │   │   ├── map/ (LiveBinMap, RouteMap)
│   │   │   ├── charts/ (WasteGenerationChart, FillLevelComparisonChart, WardWasteBarChart, EfficiencyChart)
│   │   │   └── simulator/ (SimulatorWidget)
│   │   ├── context/ (AuthContext, SocketContext)
│   │   ├── pages/ (15 comprehensive views)
│   │   ├── services/ (api, authService)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ML_MODEL_REPORT.md
│   └── DEPLOYMENT_GUIDE.md
├── start.bat
├── start.ps1
└── README.md
```

---

## 7. Documentation Links

- [REST & WebSocket API Documentation](docs/API_DOCUMENTATION.md)
- [Machine Learning Model & Training Report](docs/ML_MODEL_REPORT.md)
- [Production Deployment Guide (Vercel, Atlas, Render)](docs/DEPLOYMENT_GUIDE.md)

---

## 8. License
This project is licensed under the MIT License.
