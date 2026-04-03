# Smart Farm Frontend - Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      Smart Farm Dashboard                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    React Components                         │ │
│  │                                                             │ │
│  │ ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │ │  Dashboard   │  │SensorNode    │  │  FilterPanel    │  │ │
│  │ │  (Main)      │  │  Cards       │  │  (UI Controls)  │  │ │
│  │ └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │                                                             │ │
│  │ ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │ │Temperature  │  │Humidity      │  │Light Level      │  │ │
│  │ │Chart        │  │Chart         │  │Chart            │  │ │
│  │ │(Recharts)   │  │(Recharts)    │  │(Recharts)       │  │ │
│  │ └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │                                                             │ │
│  │ ┌──────────────────────────────────────────────────────┐  │ │
│  │ │           AlertPanel (Real-time Alerts)             │  │ │
│  │ └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Zustand Store (dashboardStore)                    │ │
│  │  Manages: sensors, sensorData, alerts, filters, timeRange  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         API Client (apiClient.ts)                          │ │
│  │                                                             │ │
│  │ ┌─────────────────┐        ┌─────────────────────────────┐│ │
│  │ │ Mock Data Layer │        │ Real API Adapter            ││ │
│  │ │ (Development)   │        │ (Production)                ││ │
│  │ └─────────────────┘        └─────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            ↓
                 ┌──────────────────────┐
                 │  Backend API Server  │
                 │  (localhost:3000)    │
                 │                      │
                 │ GET /api/sensors     │
                 │ GET /api/sensors/:id │
                 │ GET /api/sensors/    │
                 │     metadata         │
                 │ WS /api/events       │
                 └──────────────────────┘
                            ↓
                 ┌──────────────────────┐
                 │   Database (SQL)     │
                 │                      │
                 │ Consolidated data    │
                 │ from 5 Arduino nodes │
                 └──────────────────────┘
```

## Component Hierarchy

```
App
└── Dashboard
    ├── Header
    ├── ErrorBanner (if error)
    ├── Main Grid Layout
    │   ├── Left Sidebar (1 col)
    │   │   ├── FilterPanel
    │   │   │   ├── Location Checkboxes
    │   │   │   ├── Time Range Buttons
    │   │   │   └── Custom Date Labels
    │   │   └── AlertPanel
    │   │       └── Alert Items
    │   └── Main Content (3 cols)
    │       ├── Sensor Nodes Section
    │       │   └── SensorNodeCard (5x)
    │       │       ├── Status Badge
    │       │       ├── Location Name
    │       │       └── Last Transmission Time
    │       └── Selected Sensor Details (if selected)
    │           ├── Current Readings Summary
    │           │   ├── Temperature Display
    │           │   ├── Humidity Display
    │           │   └── Light Level Display
    │           ├── TemperatureChart
    │           ├── HumidityChart
    │           └── LightLevelChart
    └── Footer
```

## Data Flow

### 1. Initialization
```
App mounts
  ↓
Dashboard useEffect runs
  ↓
API: fetchSensors() → []
  ↓
Set sensors in store
  ↓
For each sensor: fetchSensorData(sensorId) → []
  ↓
Set sensor data in store
  ↓
Dashboard renders with data
```

### 2. Real-Time Updates
```
subscribeToUpdates() starts polling (every 5 seconds)
  ↓
updateMockSensorData(sensorId) OR GET /api/sensors/{id}/data
  ↓
addSensorReading(sensorId, reading)
  ↓
Store updates sensorData[sensorId]
  ↓
Chart components detect new data
  ↓
Re-render with new data point
```

### 3. Alerts
```
subscribeToAlerts() starts listening
  ↓
New alert event received
  ↓
addAlert(alert) to store
  ↓
AlertPanel receives new alerts
  ↓
Alert item rendered in list
```

## State Management (Zustand Store)

### Store Structure

```typescript
{
  // Data State
  sensors: SensorNode[]              // All 5 sensor nodes
  sensorData: Record<string, SensorReading[]>  // Data per sensor ID
  alerts: Alert[]                    // Alert history (max 50)

  // UI State
  selectedLocations: string[]        // Filtered locations
  timeRange: TimeRange               // Selected time period
  isLoading: boolean                 // API loading state
  error: string | null               // Error message

  // Actions
  setSensors(sensors)
  setSensorData(sensorId, data)
  addSensorReading(sensorId, reading)
  setAlerts(alerts)
  addAlert(alert)
  clearAlerts()
  setSelectedLocations(locations)
  setTimeRange(timeRange)
  setIsLoading(isLoading)
  setError(error)
  getFilteredSensors()               // Filtered by location
  getFilteredData(sensorId)          // Filtered by time range
}
```

## API Client Implementation

### Mock Data Mode (Development)

```
useMockData = true
  ↓
generateMockSensors() → 5 sensors with names/status
generateMockSensorData(sensorId) → 288 readings (24 hours)
generateMockMetadata() → locations, sensor_count, network_status
generateMockAlerts() → sample alerts
updateMockSensorData(sensorId) → new reading every 5 seconds
```

### Real API Mode (Production)

```
useMockData = false
  ↓
HTTP GET /api/sensors → real sensor list
HTTP GET /api/sensors/{id}/data → real historical data
HTTP GET /api/sensors/metadata → real metadata
WS /api/events → real-time alerts (or polling)
```

### Fallback Mechanism

```
Try real API
  ↓
If fails (network error, 404, timeout)
  ↓
Log error to console
  ↓
Return mock data as fallback
  ↓
User gets working app even if backend down
```

## Chart Implementation

Using Recharts library for all charts:

### TemperatureChart
- **Type**: LineChart
- **Data Key**: temperature
- **Y-Axis**: Celsius (0-40°C)
- **X-Axis**: Time (HH:mm)
- **Update**: Real-time when new reading arrives

### HumidityChart
- **Type**: LineChart
- **Data Key**: humidity
- **Y-Axis**: Percentage (0-100%)
- **X-Axis**: Time (HH:mm)
- **Update**: Real-time

### LightLevelChart
- **Type**: BarChart
- **Data Key**: light_level
- **Y-Axis**: LUX (0-1000+)
- **X-Axis**: Time (HH:mm)
- **Update**: Real-time

## Performance Optimizations

### Data Point Limiting
```
Keep only 288 readings per sensor
= 24 hours × 12 readings/hour
= ~5 minute intervals
= Manageable chart rendering
```

### No Animation on Charts
```
isAnimationActive={false}
Chart.js animation disabled for large datasets
Improves rendering performance
```

### Lazy Loading
```
Only load selected sensor's detailed charts
Don't load all 5 sensor data upfront (unless needed)
Reduces initial load time
```

### Debounced Filter Changes
```
Filter change → Debounce 300ms
→ Single re-render instead of multiple
```

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Stacked cards
- Smaller charts

### Tablet (768px - 1024px)
- 2-column layout
- Sidebar becomes narrower
- 2x2 or 3x2 sensor cards

### Desktop (> 1024px)
- 4-column layout
- 1 col sidebar + 3 cols content
- 3-column sensor card grid
- Full-width charts

## Testing Strategy

### Unit Tests (dashboard.test.ts)
```
✓ Store initialization
✓ Setting sensors
✓ Setting sensor data
✓ Adding readings (with max limit)
✓ Filtering by location
✓ Filtering by time range
✓ Managing alerts
✓ Mock data generation
```

### Integration Tests (api.integration.test.ts)
```
✓ Fetching all sensors
✓ Fetching sensor data
✓ Time range filtering
✓ Real-time subscriptions
✓ Alert subscriptions
✓ API mode switching
✓ Request logging
✓ End-to-end flow
```

## Known Limitations & Workarounds

### 1. Daytime-Only Data
**Limitation**: Sensors only transmit 6 AM - 6 PM
**UI Handling**: Show message "No transmissions (likely nighttime)"
**Cause**: Edge computing - saves battery on Arduino

### 2. Mock Data Regeneration
**Limitation**: Mock data changes on page reload
**Workaround**: Use real API for consistent testing
**Impact**: Demo purposes only, not for data validation

### 3. Polling vs WebSocket
**Current**: Polling every 5 seconds
**Benefit**: Simpler, more reliable
**Cost**: Slight latency, more requests
**Alternative**: WebSocket for true real-time (backend requirement)

### 4. Single-Page App
**Limitation**: State lost on page refresh
**Workaround**: Use localStorage or session storage
**Implementation**: Could persist filters to localStorage

## Deployment Checklist

Before deploying to production:

- [ ] Set `VITE_USE_MOCK_DATA=false`
- [ ] Set `VITE_API_URL` to real backend
- [ ] Run `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Verify API endpoints work
- [ ] Check CORS headers from backend
- [ ] Test on mobile device
- [ ] Verify responsive design
- [ ] Check console for TypeScript errors
- [ ] Update README with API URL
- [ ] Configure environment variables in deployment
- [ ] Enable caching headers on CDN
- [ ] Monitor error logs

## Future Architecture Improvements

1. **WebSocket for Real-Time**
   - Replace polling with WebSocket
   - Lower latency, fewer requests

2. **Offline Support**
   - Service Worker for caching
   - LocalStorage for state persistence

3. **Advanced Charting**
   - Add moving averages
   - Add min/max/avg calculations
   - Highlight anomalies

4. **Multi-User Features**
   - Authentication/Authorization
   - User preferences
   - Multi-dashboard support

5. **Mobile App**
   - React Native version
   - Offline-first sync
   - Push notifications
