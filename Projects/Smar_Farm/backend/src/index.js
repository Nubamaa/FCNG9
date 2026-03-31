/**
 * Smart Agriculture IoT Backend Server
 * Central hub for 5 Arduino sensor nodes (Star Topology)
 * 
 * Receives: HTTP POST from all 5 Arduino nodes
 * Stores: All data in ONE PostgreSQL database
 * Serves: REST API for Frontend Dashboard
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./database');
const {
  validateSensorPayload,
  validateSensorExists,
  validateTimestampRecency,
  checkPlausibleReadings
} = require('./validation');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================
// Route: Receive Sensor Data (Arduino → Backend)
// ============================================

/**
 * POST /api/sensors/data
 * Accept and store sensor data from Arduino nodes
 */
app.post('/api/sensors/data', async (req, res) => {
  try {
    const payload = req.body;

    // 1. Validate payload schema
    const validation = validateSensorPayload(payload);
    if (!validation.valid) {
      // Log validation error
      if (process.env.ENABLE_VALIDATION_LOG === 'true') {
        await db.query(
          `INSERT INTO data_validation_log (sensor_id, request_body, validation_error, rejected)
           VALUES ($1, $2, $3, true)`,
          [payload.sensor_id, JSON.stringify(payload), validation.error]
        );
      }
      return res.status(400).json({
        status: 'error',
        message: validation.error
      });
    }

    const { sensor_id, location, temperature, humidity, light_level, is_daytime, timestamp } = validation.value;

    // 2. Check if sensor is registered
    const sensor = await db.getOne(
      'SELECT * FROM sensors WHERE sensor_id = $1',
      [sensor_id]
    );

    if (!sensor) {
      if (process.env.ENABLE_VALIDATION_LOG === 'true') {
        await db.query(
          `INSERT INTO data_validation_log (sensor_id, request_body, validation_error, rejected)
           VALUES ($1, $2, $3, true)`,
          [sensor_id, JSON.stringify(payload), `sensor_id '${sensor_id}' not registered`]
        );
      }
      return res.status(404).json({
        status: 'error',
        message: `Sensor '${sensor_id}' not registered in system`
      });
    }

    // 3. Verify location matches
    if (sensor.location !== location) {
      console.warn(`[WARN] Sensor ${sensor_id} sent mismatched location: '${location}' vs expected '${sensor.location}'`);
    }

    // 4. Validate timestamp recency
    const timeCheck = validateTimestampRecency(timestamp);
    if (!timeCheck.valid) {
      console.warn(`[WARN] ${timeCheck.error}`);
    }

    // 5. Check for plausible readings (warnings only, doesn't block)
    const plausibility = checkPlausibleReadings(validation.value);
    if (plausibility.warnings) {
      console.warn(`[WARN] Sensor ${sensor_id}: ${plausibility.warnings.join(', ')}`);
    }

    // 6. Insert into sensor_data table
    const insertResult = await db.query(
      `INSERT INTO sensor_data (time, sensor_id, temperature, humidity, light_level, is_daytime)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [timestamp, sensor_id, temperature, humidity, light_level, is_daytime]
    );

    // 7. Update sensor metadata (last_transmission, total_transmissions)
    await db.query(
      `UPDATE sensors 
       SET last_transmission = NOW(), total_transmissions = total_transmissions + 1
       WHERE sensor_id = $1`,
      [sensor_id]
    );

    console.log(`✓ Data received from sensor ${sensor_id} (${location}): ${temperature}°C, ${humidity}%`);

    res.status(200).json({
      status: 'success',
      message: 'Data received and stored',
      record_id: sensor_id,
      timestamp: timestamp,
      data: {
        temperature,
        humidity,
        light_level,
        is_daytime
      }
    });

  } catch (error) {
    console.error('[ERROR] POST /api/sensors/data:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to store sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// Route: Fetch Sensor Metadata (Frontend → Backend)
// ============================================

/**
 * GET /api/sensors
 * Return list of all registered sensors with metadata
 */
app.get('/api/sensors', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const onlineOnly = req.query.online_only === 'true';

    let query = 'SELECT * FROM sensors';
    let params = [];

    if (onlineOnly) {
      // Online = received data in last 30 minutes (daytime expected)
      query += ` WHERE last_transmission > NOW() - INTERVAL '30 minutes'`;
    }

    query += ' LIMIT $' + (params.length + 1);
    params.push(limit);

    const sensors = await db.getAll(query, params);

    const totalCount = await db.getOne('SELECT COUNT(*) as count FROM sensors');

    res.status(200).json({
      sensors: sensors.map(s => ({
        id: s.sensor_id,
        location: s.location,
        online: s.last_transmission && new Date(s.last_transmission) > new Date(Date.now() - 30 * 60000),
        last_transmission: s.last_transmission,
        created_at: s.created_at,
        total_transmissions: s.total_transmissions
      })),
      total_count: totalCount.count
    });

  } catch (error) {
    console.error('[ERROR] GET /api/sensors:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sensors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// Route: Fetch Historical Sensor Data (Frontend → Backend)
// ============================================

/**
 * GET /api/sensors/:sensor_id/data
 * Return historical time-series data for a specific sensor
 */
app.get('/api/sensors/:sensor_id/data', async (req, res) => {
  try {
    const { sensor_id } = req.params;
    const { start_time, end_time, limit = 1000, granularity = 'raw' } = req.query;

    // Validate required parameters
    if (!start_time || !end_time) {
      return res.status(400).json({
        status: 'error',
        message: 'start_time and end_time query parameters are required (ISO 8601 format)'
      });
    }

    // Validate sensor exists
    const sensor = await db.getOne(
      'SELECT * FROM sensors WHERE sensor_id = $1',
      [sensor_id]
    );

    if (!sensor) {
      return res.status(404).json({
        status: 'error',
        message: `Sensor '${sensor_id}' not found`
      });
    }

    // Parse timestamps
    let startTime, endTime;
    try {
      startTime = new Date(start_time);
      endTime = new Date(end_time);
      if (isNaN(startTime) || isNaN(endTime)) throw new Error('Invalid date');
    } catch (e) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid start_time or end_time format (use ISO 8601: YYYY-MM-DDTHH:mm:ssZ)'
      });
    }

    const limitNum = Math.min(parseInt(limit) || 1000, 100000);

    // Query based on granularity
    let query;
    let params = [sensor_id, startTime, endTime, limitNum];

    if (granularity === 'raw') {
      query = `
        SELECT time, temperature, humidity, light_level, is_daytime
        FROM sensor_data
        WHERE sensor_id = $1 AND time BETWEEN $2 AND $3
        ORDER BY time DESC
        LIMIT $4
      `;
    } else if (granularity === '1min') {
      query = `
        SELECT 
          DATE_TRUNC('minute', time) as time,
          AVG(temperature)::DECIMAL(5,2) as temperature,
          AVG(humidity)::DECIMAL(5,2) as humidity,
          MIN(light_level) as light_level,
          MAX(is_daytime) as is_daytime
        FROM sensor_data
        WHERE sensor_id = $1 AND time BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('minute', time)
        ORDER BY time DESC
        LIMIT $4
      `;
    } else if (granularity === '5min') {
      query = `
        SELECT 
          DATE_TRUNC('minute', time)::TIMESTAMP - (EXTRACT(MINUTE FROM time)::INTEGER % 5 || ' minute')::INTERVAL as time,
          AVG(temperature)::DECIMAL(5,2) as temperature,
          AVG(humidity)::DECIMAL(5,2) as humidity,
          MIN(light_level) as light_level,
          MAX(is_daytime) as is_daytime
        FROM sensor_data
        WHERE sensor_id = $1 AND time BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('minute', time)::TIMESTAMP - (EXTRACT(MINUTE FROM time)::INTEGER % 5 || ' minute')::INTERVAL
        ORDER BY time DESC
        LIMIT $4
      `;
    } else if (granularity === '1hour') {
      query = `
        SELECT 
          DATE_TRUNC('hour', time) as time,
          AVG(temperature)::DECIMAL(5,2) as temperature,
          AVG(humidity)::DECIMAL(5,2) as humidity,
          MIN(light_level) as light_level,
          MAX(is_daytime) as is_daytime
        FROM sensor_data
        WHERE sensor_id = $1 AND time BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('hour', time)
        ORDER BY time DESC
        LIMIT $4
      `;
    } else {
      return res.status(400).json({
        status: 'error',
        message: "granularity must be 'raw', '1min', '5min', or '1hour'"
      });
    }

    const data = await db.getAll(query, params);

    res.status(200).json({
      sensor_id,
      location: sensor.location,
      data: data.reverse(), // Return in ascending time order
      record_count: data.length,
      granularity
    });

  } catch (error) {
    console.error('[ERROR] GET /api/sensors/:sensor_id/data:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// Route: Health Check
// ============================================

/**
 * GET /api/health
 * Return system health status
 */
app.get('/api/health', async (req, res) => {
  try {
    const health = await db.healthCheck();

    if (health.status !== 'connected') {
      return res.status(503).json(health);
    }

    // Count online sensors (received data in last 30 minutes)
    const onlineCount = await db.getOne(
      `SELECT COUNT(*) as count FROM sensors 
       WHERE last_transmission > NOW() - INTERVAL '30 minutes'`
    );

    // Count total sensors
    const totalCount = await db.getOne('SELECT COUNT(*) as count FROM sensors');

    // Get last data timestamp
    const lastData = await db.getOne(
      'SELECT MAX(time) as last_time FROM sensor_data'
    );

    res.status(200).json({
      status: 'healthy',
      server: 'running',
      database: health.status,
      timestamp: new Date().toISOString(),
      total_sensors: totalCount.count,
      online_sensors: onlineCount.count,
      last_data_received: lastData.last_time,
      database_timestamp: health.timestamp
    });

  } catch (error) {
    console.error('[ERROR] GET /api/health:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ============================================
// Route: API Documentation
// ============================================

/**
 * GET /api/docs
 * Return API documentation
 */
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Smart Agriculture IoT Backend API',
    version: '1.0.0',
    description: 'Central server for 5 Arduino sensor nodes (Star Topology)',
    server_ip: '192.168.1.100',
    server_port: PORT,
    endpoints: {
      'POST /api/sensors/data': 'Receive sensor data from Arduino node',
      'GET /api/sensors': 'List all registered sensors',
      'GET /api/sensors/:sensor_id/data': 'Fetch historical data for sensor',
      'GET /api/health': 'System health check',
      'GET /api/docs': 'API documentation'
    }
  });
});

// ============================================
// Root route
// ============================================

app.get('/', (req, res) => {
  res.json({
    title: 'Smart Agriculture IoT Backend',
    status: 'running',
    architecture: 'Star Topology (5 Nodes → 1 Server)',
    nodes: 5,
    endpoint: `/api/health`,
    documentation: `/api/docs`
  });
});

// ============================================
// Error handling (404)
// ============================================

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    available_endpoints: '/api/docs'
  });
});

// ============================================
// Start server
// ============================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Smart Agriculture IoT Backend Server                 ║
║  ────────────────────────────────────────────────────  ║
║  Status:        ✓ Running                             ║
║  Server:        0.0.0.0:${PORT}                           ║
║  IP Address:    192.168.1.100:${PORT}                     ║
║  Architecture:  Star Topology (5 Nodes)               ║
║  Database:      PostgreSQL smart_farm_dev             ║
║  API Docs:      http://localhost:${PORT}/api/docs       ║
║  Health Check:  http://localhost:${PORT}/api/health     ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n[SHUTDOWN] Received SIGTERM signal');
  server.close(async () => {
    console.log('[SHUTDOWN] Server closed');
    await db.closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n[SHUTDOWN] Received SIGINT signal');
  server.close(async () => {
    console.log('[SHUTDOWN] Server closed');
    await db.closePool();
    process.exit(0);
  });
});

module.exports = app;
