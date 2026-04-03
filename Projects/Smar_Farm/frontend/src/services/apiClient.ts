/**
 * API client service for Smart Farm IoT Dashboard
 * Handles HTTP requests to backend server
 * Supports both real API and mock data fallback
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SensorNode, SensorReading, SensorMetadata, Alert, TimeRange } from '../types/sensor';
import {
  generateMockSensors,
  generateMockMetadata,
  getMockSensorData,
  generateMockAlerts,
  updateMockSensorData,
} from './mockData';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

interface ApiClientConfig {
  baseURL: string;
  useMockData?: boolean;
  timeout?: number;
}

export class SmartFarmApiClient {
  private axiosInstance: AxiosInstance;
  private useMockData: boolean;
  private requestLog: Array<{ method: string; url: string; timestamp: string; status?: number }> = [];

  constructor(config: ApiClientConfig = { baseURL: 'http://localhost:3000', useMockData: true, timeout: 5000 }) {
    this.useMockData = config.useMockData ?? true;
    
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use((config) => {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logRequest(response.config.method || 'GET', response.config.url || '', response.status);
        console.log(`[API] Response: ${response.status}`, response.data);
        return response;
      },
      (error) => {
        const errorUrl = error.config?.url || 'unknown';
        const errorMethod = error.config?.method || 'GET';
        this.logRequest(errorMethod, errorUrl, error.response?.status);
        console.error(`[API] Error: ${error.message}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Log API request details
   */
  private logRequest(method: string, url: string, status?: number): void {
    this.requestLog.push({
      method,
      url,
      timestamp: new Date().toISOString(),
      status,
    });
  }

  /**
   * Get request log for debugging
   */
  getRequestLog() {
    return this.requestLog;
  }

  /**
   * Clear request log
   */
  clearRequestLog(): void {
    this.requestLog = [];
  }

  /**
   * Fetch all sensor nodes
   */
  async fetchSensors(): Promise<SensorNode[]> {
    try {
      if (this.useMockData) {
        this.logRequest('GET', '/api/sensors', 200);
        return generateMockSensors();
      }

      const response = await this.axiosInstance.get<SensorNode[]>('/api/sensors');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sensors, using mock data', error);
      this.logRequest('GET', '/api/sensors', 500);
      return generateMockSensors();
    }
  }

  /**
   * Fetch sensor metadata
   */
  async fetchMetadata(): Promise<SensorMetadata> {
    try {
      if (this.useMockData) {
        this.logRequest('GET', '/api/sensors/metadata', 200);
        return generateMockMetadata();
      }

      const response = await this.axiosInstance.get<SensorMetadata>('/api/sensors/metadata');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch metadata, using mock data', error);
      this.logRequest('GET', '/api/sensors/metadata', 500);
      return generateMockMetadata();
    }
  }

  /**
   * Fetch sensor data for a specific sensor and time range
   * @param sensorId - The sensor ID (e.g., "001")
   * @param timeRange - Time range for data (optional defaults to last 24 hours)
   * @param limit - Maximum number of data points to return (default: 288 = 24 hours @ 5 min intervals)
   */
  async fetchSensorData(
    sensorId: string,
    timeRange?: TimeRange,
    limit: number = 288
  ): Promise<SensorReading[]> {
    try {
      if (this.useMockData) {
        this.logRequest('GET', `/api/sensors/${sensorId}/data`, 200);
        const data = getMockSensorData(sensorId);
        
        // Filter by time range if provided
        if (timeRange) {
          return data.filter((reading) => {
            const timestamp = dayjs(reading.timestamp);
            return (
              timestamp.isAfter(dayjs(timeRange.startTime)) &&
              timestamp.isBefore(dayjs(timeRange.endTime))
            );
          });
        }
        
        // Return last N readings
        return data.slice(-limit);
      }

      const params: Record<string, string | number> = { limit };
      if (timeRange) {
        params.start_time = timeRange.startTime;
        params.end_time = timeRange.endTime;
      }

      const response = await this.axiosInstance.get<SensorReading[]>(
        `/api/sensors/${sensorId}/data`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch data for sensor ${sensorId}, using mock data`, error);
      const data = getMockSensorData(sensorId);
      return data.slice(-limit);
    }
  }

  /**
   * Simulate real-time data updates
   * In production, this would be a WebSocket or Server-Sent Events connection
   */
  subscribeToUpdates(
    sensorIds: string[],
    callback: (sensorId: string, reading: SensorReading | null) => void,
    intervalMs: number = 5000
  ): () => void {
    const interval = setInterval(() => {
      sensorIds.forEach((sensorId) => {
        try {
          if (this.useMockData) {
            const reading = updateMockSensorData(sensorId);
            callback(sensorId, reading);
          } else {
            // In production, this would poll the real API
            this.fetchSensorData(sensorId, undefined, 1).then((readings) => {
              if (readings.length > 0) {
                callback(sensorId, readings[readings.length - 1]);
              }
            });
          }
        } catch (error) {
          console.error(`Error updating sensor ${sensorId}`, error);
        }
      });
    }, intervalMs);

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  /**
   * Subscribe to alerts
   * In production, this would be a WebSocket connection
   */
  subscribeToAlerts(callback: (alert: Alert) => void, intervalMs: number = 10000): () => void {
    const alerts = generateMockAlerts();
    let alertIndex = 0;

    const interval = setInterval(() => {
      if (alertIndex < alerts.length) {
        callback(alerts[alertIndex]);
        alertIndex++;
      } else {
        // Optionally generate new random alerts
        if (Math.random() > 0.8) {
          const randomAlert: Alert = {
            event_type: Math.random() > 0.5 ? 'temperature_alert' : 'offline_alert',
            sensor_id: String(Math.floor(Math.random() * 5) + 1).padStart(3, '0'),
            value: 25 + Math.random() * 15,
            threshold: 30,
            timestamp: dayjs().utc().toISOString(),
            location: `Location_${Math.floor(Math.random() * 5)}`,
          };
          callback(randomAlert);
        }
      }
    }, intervalMs);

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  /**
   * Switch between mock and real API
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
    console.log(useMock ? '[API] Using mock data' : '[API] Using real API');
  }

  /**
   * Get current API mode
   */
  isUsingMockData(): boolean {
    return this.useMockData;
  }
}

// Export singleton instance
const apiClient = new SmartFarmApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false',
  timeout: 5000,
});

export default apiClient;
