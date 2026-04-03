/**
 * Integration tests for API Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartFarmApiClient } from '../services/apiClient';
import { generateMockSensors, generateMockSensorData } from '../services/mockData';
import dayjs from 'dayjs';

describe('SmartFarmApiClient - Integration Tests', () => {
  let client: SmartFarmApiClient;

  beforeEach(() => {
    client = new SmartFarmApiClient({
      baseURL: 'http://localhost:3000',
      useMockData: true,
      timeout: 5000,
    });
    client.clearRequestLog();
  });

  afterEach(() => {
    client.clearRequestLog();
  });

  describe('Sensor Fetching', () => {
    it('should fetch all sensors', async () => {
      const sensors = await client.fetchSensors();

      expect(sensors).toHaveLength(5);
      expect(sensors[0]).toHaveProperty('id');
      expect(sensors[0]).toHaveProperty('location');
      expect(sensors[0]).toHaveProperty('online');
      expect(sensors[0]).toHaveProperty('last_transmission');
    });

    it('should fetch metadata', async () => {
      const metadata = await client.fetchMetadata();

      expect(metadata).toHaveProperty('sensor_count');
      expect(metadata.sensor_count).toBe(5);
      expect(Array.isArray(metadata.locations)).toBe(true);
      expect(metadata.locations.length).toBe(5);
    });
  });

  describe('Sensor Data Fetching', () => {
    it('should fetch sensor data', async () => {
      const data = await client.fetchSensorData('001');

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('temperature');
      expect(data[0]).toHaveProperty('humidity');
      expect(data[0]).toHaveProperty('light_level');
      expect(data[0]).toHaveProperty('is_daytime');
    });

    it('should limit data points', async () => {
      const data = await client.fetchSensorData('002', undefined, 50);

      expect(data.length).toBeLessThanOrEqual(50);
    });

    it('should filter data by time range', async () => {
      const startTime = dayjs().utc().subtract(6, 'hours').toISOString();
      const endTime = dayjs().utc().toISOString();

      const data = await client.fetchSensorData('003', {
        startTime,
        endTime,
        label: 'Last 6 hours',
      });

      expect(data.every((d) => dayjs(d.timestamp).isAfter(dayjs(startTime)))).toBe(true);
      expect(data.every((d) => dayjs(d.timestamp).isBefore(dayjs(endTime)))).toBe(true);
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to sensor updates', (done) => {
      const updates: Record<string, number> = {};
      const timeout = setTimeout(() => {
        unsubscribe();
        done(new Error('Timeout waiting for updates'));
      }, 2000);

      const unsubscribe = client.subscribeToUpdates(
        ['001', '002'],
        (sensorId, reading) => {
          if (!updates[sensorId]) {
            updates[sensorId] = 0;
          }
          if (reading) {
            updates[sensorId]++;
          }

          // At least one sensor should have received an update
          if (updates['001'] > 0 || updates['002'] > 0) {
            clearTimeout(timeout);
            unsubscribe();
            done();
          }
        },
        100 // Fast interval for testing
      );
    });

    it('should subscribe to alerts', (done) => {
      const alertsReceived: any[] = [];
      const timeout = setTimeout(() => {
        unsubscribe();
        done(new Error('Timeout waiting for alerts'));
      }, 3000);

      const unsubscribe = client.subscribeToAlerts((alert) => {
        alertsReceived.push(alert);

        if (alertsReceived.length > 0) {
          clearTimeout(timeout);
          unsubscribe();
          
          expect(alertsReceived[0]).toHaveProperty('event_type');
          expect(alertsReceived[0]).toHaveProperty('sensor_id');
          expect(alertsReceived[0]).toHaveProperty('timestamp');
          done();
        }
      }, 500);
    });
  });

  describe('API Mode Switching', () => {
    it('should switch between mock and real API', () => {
      expect(client.isUsingMockData()).toBe(true);

      client.setUseMockData(false);
      expect(client.isUsingMockData()).toBe(false);

      client.setUseMockData(true);
      expect(client.isUsingMockData()).toBe(true);
    });

    it('should return mock data even when real API is set (fallback)', async () => {
      // This tests the fallback mechanism when API is unavailable
      client.setUseMockData(false);

      const sensors = await client.fetchSensors();
      expect(sensors.length).toBe(5);

      client.setUseMockData(true);
    });
  });

  describe('Request Logging', () => {
    it('should log API requests', async () => {
      client.clearRequestLog();

      await client.fetchSensors();
      const log = client.getRequestLog();

      expect(log.length).toBeGreaterThan(0);
      expect(log[log.length - 1]).toHaveProperty('method');
      expect(log[log.length - 1]).toHaveProperty('url');
      expect(log[log.length - 1]).toHaveProperty('timestamp');
    });
  });
});

describe('End-to-End Dashboard Flow', () => {
  it('should load all data for dashboard initialization', async () => {
    const client = new SmartFarmApiClient({ useMockData: true });

    // Step 1: Fetch sensors
    const sensors = await client.fetchSensors();
    expect(sensors.length).toBe(5);

    // Step 2: Fetch data for each sensor
    const allData: Record<string, any[]> = {};
    for (const sensor of sensors) {
      allData[sensor.id] = await client.fetchSensorData(sensor.id);
      expect(allData[sensor.id].length).toBeGreaterThan(0);
    }

    // Step 3: Verify data integrity
    Object.values(allData).forEach((data) => {
      expect(data[0]).toHaveProperty('temperature');
      expect(data[0]).toHaveProperty('humidity');
      expect(data[0]).toHaveProperty('light_level');
    });
  });
});
