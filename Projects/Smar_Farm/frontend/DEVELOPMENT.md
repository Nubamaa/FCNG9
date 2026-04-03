# Smart Farm Frontend - Development Utilities

## Local Storage Configuration

The frontend dashboard can persist user preferences:

- **Selected Locations**: Auto-saved filter selections
- **Time Range Preference**: Last selected time range
- **API Mode**: Mock vs. Real API preference

## CORS Configuration

If using a local backend API on a different port, ensure the backend has CORS enabled:

```javascript
// Backend example (Node.js/Express)
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## Development Server Configuration

### Default Settings
- **Port**: 5173
- **Host**: localhost
- **Protocol**: HTTP

### Custom Port

Edit `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3001, // Custom port
    open: true  // Auto-open browser
  }
})
```

## Hot Module Replacement (HMR)

Changes to component files automatically update in the browser without full refresh.

```bash
npm run dev
```

Then edit any `.tsx`, `.ts`, or `.css` file to see instant updates.

## Debugging

### Console Logging

All API requests are logged to console:

```javascript
// In browser console
// [API] GET /api/sensors
// [API] Response: 200 {...}
```

### Request Log Viewer

Access the request log programmatically:

```javascript
import apiClient from './services/apiClient';
console.log(apiClient.getRequestLog());
```

### React DevTools

Install React DevTools browser extension for component inspection:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore)
- Firefox: [React Developer Tools](https://addons.mozilla.org/firefox)

### Zustand DevTools

View state changes in real-time:

```javascript
import { useDashboardStore } from './stores/dashboardStore';
// Open browser DevTools console
const state = useDashboardStore.getState();
console.log(state);
```

## Mock Data Customization

Edit `src/services/mockData.ts` to change:

1. **Sensor Locations**:
   ```typescript
   const LOCATIONS = ['Location_1', 'Location_2', ...];
   ```

2. **Temperature Ranges**:
   ```typescript
   const baseTemp = 20; // Change base temperature
   const dailyCycle = 10 * Math.sin(...); // Change amplitude
   ```

3. **Sensor Count**:
   ```typescript
   const SENSOR_IDS = ['001', '002', '003', '004', '005'];
   ```

## API Testing Tools

### Using cURL (if backend available)

```bash
# Get all sensors
curl http://localhost:3000/api/sensors

# Get sensor data
curl "http://localhost:3000/api/sensors/001/data?limit=10"

# Get metadata
curl http://localhost:3000/api/sensors/metadata
```

### Using Postman

1. Import requests from `POSTMAN_COLLECTION.json` (if available)
2. Set base URL to `http://localhost:3000`
3. Test endpoints before connecting to frontend

## Performance Monitoring

### Build Size

```bash
npm run build

# View bundle analysis
npm run build -- --report
```

### Page Load Performance

Open DevTools → Performance tab:
1. Click "Record"
2. Reload page
3. Stop recording
4. Analyze flame chart

### Network Tab

DevTools → Network tab:
- Check API request sizes
- Verify request/response times
- Look for waterfall delays

## Browser Compatibility

Tested on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Android

## Common Commands

```bash
# Start development
npm run dev

# Build for deployment
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run integration tests
npm run test:integration

# Lint TypeScript
npm run type-check  # (if added)
```

## Troubleshooting Checklist

- [ ] Node.js version >= 16
- [ ] npm dependencies installed (`npm install`)
- [ ] Backend running on `http://localhost:3000` (or mock data enabled)
- [ ] No firewall blocking localhost connections
- [ ] Port 5173 is available
- [ ] Browser cache cleared
- [ ] Console shows no TypeScript errors
