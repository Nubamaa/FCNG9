/**
 * Mock data provider for development and testing
 * Generates realistic sensor data matching expected API responses
 */

import { SensorNode, SensorReading, SensorMetadata, Alert } from '../types/sensor';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const LOCATIONS = [
  'North_Field',
  'Tomato_Greenhouse',
  'East_Garage',
  'South_Storage',
  'West_Shed',
];

const SENSOR_IDS = ['001', '002', '003', '004', '005'];

// Generate realistic temperature data
function generateTemperature(hour: number): number {
  // Simulate daily temperature cycle: cooler at night, warmer during day
  const baseTemp = 20;
  const dailyCycle = 10 * Math.sin((hour - 6) * Math.PI / 12);
  const randomVariation = (Math.random() - 0.5) * 2;
  return Math.round((baseTemp + dailyCycle + randomVariation) * 10) / 10;
}

// Generate realistic humidity data
function generateHumidity(hour: number, temp: number): number {
  // Humidity inversely correlated with temperature
  const baseHumidity = 65;
  const tempEffect = (25 - temp) * 2;
  const randomVariation = (Math.random() - 0.5) * 10;
  return Math.max(20, Math.min(95, baseHumidity + tempEffect + randomVariation));
}

// Generate light level based on time of day
function generateLightLevel(hour: number): { level: number; isDay: boolean } {
  // Assume daytime is 6 AM to 6 PM
  const isDaytime = hour >= 6 && hour < 18;
  
  if (!isDaytime) {
    return { level: 0, isDay: false };
  }
  
  // Light levels vary throughout the day
  let level = 0;
  if (hour >= 6 && hour < 8) {
    level = 100 + (hour - 6) * 300; // Sunrise
  } else if (hour >= 8 && hour < 17) {
    level = 700 + Math.random() * 300; // Peak daylight
  } else {
    level = 1000 - (hour - 17) * 300; // Sunset
  }
  
  return { level: Math.max(0, Math.round(level)), isDay: true };
}

/**
 * Generate mock sensor readings for the last 24 hours
 */
export function generateMockSensorData(sensorId: string): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = dayjs().utc();
  
  // Generate 288 readings (12 per hour for 24 hours)
  for (let i = 287; i >= 0; i--) {
    const timestamp = now.subtract(i * 5, 'minutes');
    const hour = timestamp.hour();
    
    const temperature = generateTemperature(hour);
    const humidity = generateHumidity(hour, temperature);
    const { level: light_level, isDay: is_daytime } = generateLightLevel(hour);
    
    readings.push({
      timestamp: timestamp.toISOString(),
      temperature,
      humidity: Math.round(humidity),
      light_level,
      is_daytime,
    });
  }
  
  return readings;
}

/**
 * Generate mock sensor nodes
 */
export function generateMockSensors(): SensorNode[] {
  return SENSOR_IDS.map((id, index) => ({
    id,
    location: LOCATIONS[index],
    online: Math.random() > 0.1, // 90% online
    last_transmission: dayjs()
      .utc()
      .subtract(Math.random() * 10, 'minutes')
      .toISOString(),
  }));
}

/**
 * Generate mock metadata
 */
export function generateMockMetadata(): SensorMetadata {
  return {
    locations: LOCATIONS,
    sensor_count: SENSOR_IDS.length,
    network_status: 'healthy',
  };
}

/**
 * Generate mock alerts for testing
 */
export function generateMockAlerts(): Alert[] {
  const now = dayjs().utc();
  return [
    {
      event_type: 'temperature_alert',
      sensor_id: '002',
      value: 36.2,
      threshold: 35,
      timestamp: now.subtract(5, 'minutes').toISOString(),
      location: 'Tomato_Greenhouse',
    },
  ];
}

// Cache for mock data
let mockDataCache: Record<string, SensorReading[]> = {};

/**
 * Get or create mock data for a sensor
 */
export function getMockSensorData(sensorId: string): SensorReading[] {
  if (!mockDataCache[sensorId]) {
    mockDataCache[sensorId] = generateMockSensorData(sensorId);
  }
  return mockDataCache[sensorId];
}

/**
 * Simulate real-time data update
 * Adds a new reading to the mock data
 */
export function updateMockSensorData(sensorId: string): SensorReading | null {
  const data = getMockSensorData(sensorId);
  const lastReading = data[data.length - 1];
  const now = dayjs().utc();
  const hour = now.hour();
  
  // Only generate daytime data
  const { level: light_level, isDay: is_daytime } = generateLightLevel(hour);
  
  if (!is_daytime && lastReading.is_daytime) {
    // Transition to nighttime - sensor stops transmitting
    return null;
  }
  
  if (!is_daytime) {
    return null;
  }
  
  const newReading: SensorReading = {
    timestamp: now.toISOString(),
    temperature: generateTemperature(hour),
    humidity: generateHumidity(hour, generateTemperature(hour)),
    light_level,
    is_daytime,
  };
  
  data.push(newReading);
  
  // Keep only last 288 readings (24 hours)
  if (data.length > 288) {
    data.shift();
  }
  
  return newReading;
}

/**
 * Clear mock data cache (useful for testing)
 */
export function clearMockDataCache(): void {
  mockDataCache = {};
}
