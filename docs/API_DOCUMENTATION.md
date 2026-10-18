# EcoNexa — Complete API Documentation

Base URL: `http://localhost:5000/api`  
ML Service: `http://127.0.0.1:5001`  
WebSocket Endpoint: `ws://localhost:5000`

---

## 1. Authentication & Users

### `POST /api/auth/register`
Creates a new municipal user account.
- **Request Body**:
  ```json
  {
    "name": "Anand Murthy",
    "email": "anand@smartwaste.city",
    "password": "password123",
    "role": "staff",
    "phone": "+91 98765 00000",
    "assignedWard": "Ward-1 Central Market"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "6601a0...",
      "name": "Anand Murthy",
      "email": "anand@smartwaste.city",
      "role": "staff",
      "phone": "+91 98765 00000",
      "assignedWard": "Ward-1 Central Market",
      "status": "active"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT.
- **Request Body**:
  ```json
  {
    "email": "admin@smartwaste.city",
    "password": "password123"
  }
  ```

### `GET /api/auth/me`
*Header: `Authorization: Bearer <token>`*  
Returns current authenticated user profile.

### `PUT /api/auth/profile`
*Header: `Authorization: Bearer <token>`*  
Updates name, phone, or assigned ward.

---

## 2. Waste Bin Management

### `GET /api/bins`
*Header: `Authorization: Bearer <token>`*  
- **Query Parameters**:
  - `ward`: filter by ward name
  - `category`: `general` | `recyclable` | `organic` | `hazardous`
  - `status`: `normal` | `warning` | `critical` | `damaged`
  - `search`: search query by ID, address, or ward

### `GET /api/bins/:id`
Returns single bin details, recent 30 fill history readings, and real-time AI prediction.

### `POST /api/bins` *(Admin Only)*
Registers a new waste bin with coordinates.
- **Request Body**:
  ```json
  {
    "binId": "BIN-W1-015",
    "label": "City Town Hall South Plaza",
    "ward": "Ward-1 Central Market",
    "category": "recyclable",
    "capacityLiters": 1200,
    "coordinates": [77.5946, 12.9716],
    "address": "Town Hall Avenue",
    "criticalThreshold": 80,
    "warningThreshold": 60
  }
  ```

### `PUT /api/bins/:id` *(Admin / Officer)*
Updates bin properties, thresholds, or coordinates.

### `DELETE /api/bins/:id` *(Admin Only)*
Decommissions and removes a bin from the active fleet.

---

## 3. Real-Time Telemetry & Monitoring

### `GET /api/monitoring/kpis`
Returns 8 key municipal dashboard metrics:
```json
{
  "success": true,
  "kpis": {
    "totalBins": 10,
    "normalBins": 4,
    "warningBins": 2,
    "criticalBins": 4,
    "scheduledToday": 2,
    "pendingTasks": 1,
    "averageFillPercentage": 68.2,
    "predictedOverflows": 3,
    "activeAlertsCount": 3
  }
}
```

### `POST /api/monitoring/sensor-reading`
*Authentication: Header `x-api-key: iot_smartwaste_sensor_auth_key_8899` or Bearer Token*  
Accepts real hardware IoT sensor readings or simulator telemetry.
- **Request Body**:
  ```json
  {
    "binId": "BIN-W1-001",
    "fillPercentage": 89.5,
    "source": "sensor",
    "batteryLevel": 94,
    "temperatureCelsius": 28.5
  }
  ```

### `GET /api/monitoring/simulator/status`
Returns `{ isRunning: true, intervalMs: 5000, cyclesCompleted: 42 }`.

### `POST /api/monitoring/simulator/toggle` *(Admin Only)*
Starts or pauses the automated sensor simulator. Body: `{ "action": "start"|"stop", "intervalMs": 5000 }`.

---

## 4. AI Prediction Service

### `GET /api/predictions/bin/:id`
Invokes the Scikit-Learn Random Forest Regressor to compute fill levels at +6h, +12h, and +24h, hours to reach critical threshold (80%), and confidence score.

### `GET /api/predictions/all`
Batch predicts across the fleet and categorizes bins by imminent overflow risk (<6h, <14h).

### `GET /api/predictions/metrics`
Returns model training evaluation metrics (MAE, RMSE, R²).

---

## 5. Collection Tasks & TSP Route Optimization

### `POST /api/collection/optimize`
Runs the Nearest-Neighbor TSP heuristic algorithm for a list of bin IDs.
- **Request Body**:
  ```json
  {
    "binIds": ["6601b0000000000000000001", "6601b0000000000000000003"],
    "depotCoordinates": [77.5946, 12.9716]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "result": {
      "orderedBins": [...],
      "waypoints": [
        { "binId": "BIN-W1-003", "label": "Brigade Road", "order": 1, "distanceFromPrevKm": 1.4 },
        { "binId": "BIN-W1-001", "label": "Russell Market", "order": 2, "distanceFromPrevKm": 2.2 }
      ],
      "totalDistanceKm": 6.4,
      "totalDurationMin": 28,
      "fuelSavedLiters": 1.8,
      "co2SavedKg": 4.8,
      "costSavedInr": 165
    }
  }
  ```

### `POST /api/collection/tasks` *(Admin Only)*
Creates and dispatches an optimized collection route to municipal staff.

### `PUT /api/collection/tasks/:id/status` *(Admin / Staff)*
Updates task status:
- `in_progress`: Starts route.
- `completed`: Accepts `collectedWeightKg`, resets bins to empty (5% residual level), and resolves associated overflow alerts automatically!

### `POST /api/collection/report-issue` *(Staff / Officer / Admin)*
Logs damaged bin, broken lid, or road obstruction incidents, creating critical maintenance alerts.

---

## 6. Alerts & Incidents

### `GET /api/alerts`
Retrieves alerts filtered by `severity` (`critical`, `high`, `medium`, `low`) and `resolved` (`true`/`false`).

### `PUT /api/alerts/:id/resolve`
Marks an alert as resolved with timestamp and user ID.

---

## 7. Analytics & CSV Export

### `GET /api/analytics/summary`
Returns weekly generation/collection volume, ward-wise fill levels, category breakdown, and cost/carbon savings.

### `GET /api/analytics/export-csv?type=bins|tasks|logs`
Streams downloadable CSV file directly to the client browser.

---

## 8. WebSocket Telemetry Events (Socket.IO)

Clients connect to `http://localhost:5000` and can listen to:
- `bin:updated`: Emitted whenever any bin's fill level or status changes.
- `alert:new`: Emitted whenever a threshold is crossed or incident reported.
- `task:updated`: Emitted when collection tasks are created, started, or finished.
- `simulator:status`: Emitted when simulator is started, stopped, or interval changed.
