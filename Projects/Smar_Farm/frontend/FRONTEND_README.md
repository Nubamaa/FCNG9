# Frontend Developer: Smart Farm IoT Dashboard

## Project Overview

This is the **Smart Farm IoT Dashboard** - a real-time, responsive web application that monitors sensor data from 5 Arduino sensor nodes deployed across a smart farm.

The dashboard displays:
- **Real-time sensor node status** (5 locations)
- **Temperature, humidity, and light level charts**
- **Alert notifications** for anomalies
- **Filtering by location and time range**
- **Mock data for development** (with easy switch to live API)

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **UI State Management**: Zustand
- **Charting**: Recharts
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard component
│   │   ├── SensorNodeCard.tsx     # Sensor node card display
│   │   ├── ChartComponents.tsx    # Temperature, Humidity, Light charts
│   │   ├── AlertPanel.tsx         # Alert notifications panel
│   │   └── FilterPanel.tsx        # Location & time range filters
│   ├── services/
│   │   ├── apiClient.ts           # API client (mock + real)
│   │   └── mockData.ts            # Mock data generator
│   ├── stores/
│   │   └── dashboardStore.ts      # Zustand state management
│   ├── types/
│   │   └── sensor.ts              # TypeScript type definitions
│   ├── __tests__/
│   │   ├── dashboard.test.ts      # Unit tests
│   │   └── api.integration.test.ts # Integration tests
│   ├── App.tsx                    # Root app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── public/                        # Static assets
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Vite build config
├── vitest.config.ts               # Vitest test config
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.js              # PostCSS config
└── index.html                     # HTML entry point
```

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Backend API running on `http://localhost:3000` (or use mock data)

### Installation

```bash
# Navigate to frontend directory
cd Projects/Smar_Farm/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run integration tests
npm run test:integration
```

The dashboard will open at `http://localhost:5173`

## Environment Variables

Create a `.env` file in the frontend directory:

```env
# Backend API URL (optional, defaults to http://localhost:3000)
VITE_API_URL=http://localhost:3000

# Use mock data for development (defaults to true)
VITE_USE_MOCK_DATA=true
```

## Features

### 1. Sensor Node Dashboard
- Displays all 5 sensor locations with online/offline status
- Shows last transmission timestamp (relative time, e.g., "2 minutes ago")
- Click a sensor to view detailed charts

### 2. Real-Time Charts
- **Temperature Chart**: Line graph with 24-hour history
- **Humidity Chart**: Percentage humidity over time
- **Light Level Chart**: Bar chart showing light intensity (LUX)
- All charts auto-update every 5 seconds with new data

### 3. Filtering & Navigation
- **Location Filter**: Multi-select dropdown to show/hide locations
- **Time Range Presets**: Last 6/24 hours, 7/30 days
- **Smart Date Display**: Shows date range of current view

### 4. Alert System
- **Real-time alerts** for temperature out-of-range conditions
- **Offline alerts** when sensors stop transmitting
- Alert history panel with timestamps
- Clear all alerts button

### 5. Responsive Design
- Desktop-optimized layout (> 1024px)
- Tablet layout (768-1024px)
- Mobile-friendly view (< 768px)
- Works on all modern browsers

## API Integration

The dashboard consumes REST APIs from the Backend:

### Required Endpoints

```
GET /api/sensors
  Returns: [{id: "001", location: "North_Field", online: true, last_transmission: "2026-03-31T14:23:00Z"}, ...]

GET /api/sensors/{sensor_id}/data?start_time=&end_time=&limit=100
  Returns: [{timestamp: "2026-03-31T14:23:00Z", temperature: 24.5, humidity: 65, light_level: 800, is_daytime: true}, ...]

GET /api/sensors/metadata
  Returns: {locations: ["North_Field", ...], sensor_count: 5, network_status: "healthy"}

WS /api/events (or polling GET /api/events/stream)
  Real-time alerts: {event_type: "temperature_alert", sensor_id: "001", value: 36.2, threshold: 35, timestamp: "..."}
```

### Switching Between Mock and Real API

**During Development (using mock data)**:
```env
VITE_USE_MOCK_DATA=true
```

The dashboard will generate realistic sensor data locally without needing the backend.

**Production (using real API)**:
```env
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://your-backend-url:3000
```

The API client automatically falls back to mock data if the real API is unavailable.

## State Management

The dashboard uses **Zustand** for state management. Key store functions:

```javascript
// Get or set sensor data
useDashboardStore().sensorData
useDashboardStore().setSensorData(sensorId, data)

// Filter by location
useDashboardStore().setSelectedLocations(['North_Field'])
useDashboardStore().getFilteredSensors()

// Filter by time range
useDashboardStore().setTimeRange(timeRange)
useDashboardStore().getFilteredData(sensorId)

// Manage alerts
useDashboardStore().addAlert(alert)
useDashboardStore().clearAlerts()
```

## Testing

### Unit Tests
Test store logic, mock data generation, and component state:

```bash
npm test
```

Tests include:
- Store initialization and actions
- Mock data generation
- Sensor filtering
- Alert management

### Integration Tests
Test API client with both mock and real endpoints:

```bash
npm run test:integration
```

Tests include:
- Fetching sensor list and data
- Time range filtering
- Real-time subscriptions
- Alert streaming
- API mode switching

### Run Tests with UI
```bash
npm run test:ui
```

Opens a visual test dashboard in your browser.

## Performance Optimization

### Implemented
- ✅ Chart rendering optimization (no animation on large datasets)
- ✅ Data point limiting (max 288 points = 24 hours @ 5-min intervals)
- ✅ Lazy loading of historical data
- ✅ Efficient re-rendering with Zustand
- ✅ Request debouncing for filter changes

### Recommendations for Production
- Implement pagination for historical data export
- Add service worker caching for offline support
- Optimize chart rendering with `canvas` renderer option
- Implement virtual scrolling for large alert lists
- Add compression for API responses

## Accessibility

The dashboard includes:
- ✅ Semantic HTML structure
- ✅ ARIA labels for controls
- ✅ Keyboard navigation support
- ✅ Color contrast compliance (WCAG AA)
- ✅ Screen reader friendly alerts
- ✅ Focus indicators on interactive elements

## Troubleshooting

### Dashboard not loading data
1. Check browser console for errors
2. Verify Backend API is running on `http://localhost:3000`
3. Check if `VITE_USE_MOCK_DATA` is set correctly
4. Try switching to mock data if API is unavailable

### Charts not updating
1. Open DevTools → Network tab
2. Look for polling requests to `/api/sensors/{id}/data`
3. Check if `subscribeToUpdates()` is being called
4. Verify time range includes recent data

### Mobile layout issues
1. Check viewport meta tag in `index.html`
2. Test with actual device or DevTools device emulation
3. Verify Tailwind CSS breakpoints match design

### Test failures
1. Clear cache: `rm -rf node_modules/.vite`
2. Reinstall dependencies: `npm install`
3. Check if Vitest has all required dependencies
4. Run with verbose output: `npm test -- --reporter=verbose`

## API Request Logging

The API client logs all requests for debugging:

```javascript
// Get request log
apiClient.getRequestLog()

// Output:
[
  { method: 'GET', url: '/api/sensors', timestamp: '2026-03-31T14:23:00Z', status: 200 },
  { method: 'GET', url: '/api/sensors/001/data', timestamp: '2026-03-31T14:23:05Z', status: 200 },
  ...
]
```

## Known Limitations

1. **Daytime-only sensing**: The dashboard shows gaps at night (3 AM - 6 AM) when no data transmits. This is expected edge computing behavior.

2. **Mock data consistency**: Mock data is regenerated on page reload. Use real API for consistent historical data.

3. **Real-time latency**: Updates poll every 5 seconds. For true real-time, requires WebSocket integration.

4. **Historical data limit**: Only fetches last 24 hours by default. Older data requires date range query.

5. **No user authentication**: Dashboard assumes single-user environment. Add auth for multi-user deployments.

## Future Enhancements

- [ ] WebSocket connection for true real-time updates
- [ ] Historical data export (CSV, JSON)
- [ ] Custom alert threshold configuration
- [ ] Predictive analytics (trend analysis, harvest recommendations)
- [ ] Multi-user roles (admin, viewer, editor)
- [ ] Dark mode theme
- [ ] Mobile app (React Native)

## Development Workflow

### Adding a New Feature

1. Create component in `src/components/`
2. Define types in `src/types/sensor.ts` if needed
3. Add store actions in `src/stores/dashboardStore.ts`
4. Write tests in `src/__tests__/`
5. Import and use in `Dashboard.tsx`
6. Test with `npm run dev`

### Example: Adding Temperature Alert Threshold

```javascript
// 1. Add to types/sensor.ts
interface AlertThreshold {
  temperature_max: number;
  temperature_min: number;
}

// 2. Add to store
const store = useDashboardStore();
store.setAlertThreshold(threshold);

// 3. Use in Dashboard
const thresholds = store.alertThresholds;
if (reading.temperature > thresholds.temperature_max) {
  // Show alert
}

// 4. Test it
describe('Alert thresholds', () => {
  it('should trigger alert when exceeding threshold...', () => {
    // Test code
  });
});
```

## Contributing

When submitting changes:
1. Run `npm test` to ensure all tests pass
2. Follow existing code style (prettier format)
3. Update README if adding new features
4. Test on mobile device or with DevTools emulation
5. Verify API integration points match backend API

## Questions & Support

For questions about:
- **Backend API endpoints**: See Backend Developer 1 documentation
- **Real-time updates**: Discuss WebSocket vs. polling strategy with Backend Dev 2
- **Sensor data format**: Reference `types/sensor.ts` and `mockData.ts`

## Acceptance Criteria

The implementation is complete when:
- [x] Dashboard displays 5 sensor nodes with location names and status
- [x] Real-time temperature/humidity graphs update smoothly
- [x] Filtering by location works correctly
- [x] API client tested with mocked responses
- [x] Unit and integration tests pass
- [x] Responsive design verified (mobile, tablet, desktop)
- [x] README documents setup and features
- [x] Code is clean, typed, and maintainable

## License

See main project README for license information.
