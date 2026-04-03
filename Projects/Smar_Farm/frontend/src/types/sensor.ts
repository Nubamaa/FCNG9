/**
 * Type definitions for the Smart Farm IoT Dashboard
 */

export interface SensorNode {
  id: string;
  location: string;
  online: boolean;
  last_transmission: string; // ISO 8601 UTC string
}

export interface SensorReading {
  timestamp: string; // ISO 8601 UTC string
  temperature: number; // Celsius
  humidity: number; // Percentage (0-100)
  light_level: number; // LUX
  is_daytime: boolean;
}

export interface SensorMetadata {
  locations: string[];
  sensor_count: number;
  network_status: 'healthy' | 'degraded' | 'critical';
}

export interface Alert {
  event_type: 'temperature_alert' | 'offline_alert' | 'humidity_alert';
  sensor_id: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  location: string;
}

export interface APIResponse<T> {
  data: T;
  timestamp: string;
  status: 'success' | 'error';
  message?: string;
}

export interface TimeRange {
  startTime: string;
  endTime: string;
  label: string;
}

export interface FilterOptions {
  locations: string[];
  timeRange: TimeRange;
}
