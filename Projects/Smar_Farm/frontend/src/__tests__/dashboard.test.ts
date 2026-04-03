/**
 * Unit tests for Dashboard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardStore } from '../stores/dashboardStore';
import { generateMockSensors, generateMockSensorData } from '../services/mockData';
import dayjs from 'dayjs';

describe('Dashboard Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useDashboardStore());
    // Reset store before each test
    act(() => {
      result.current.setSensors([]);
      result.current.setAlerts([]);
      result.current.clearAlerts();
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useDashboardStore());
    expect(result.current.sensors).toEqual([]);
    expect(result.current.alerts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set sensors correctly', () => {
    const { result } = renderHook(() => useDashboardStore());
    const mockSensors = generateMockSensors();

    act(() => {
      result.current.setSensors(mockSensors);
    });

    expect(result.current.sensors).toEqual(mockSensors);
    expect(result.current.sensors.length).toBe(5);
  });

  it('should set sensor data', () => {
    const { result } = renderHook(() => useDashboardStore());
    const mockData = generateMockSensorData('001');

    act(() => {
      result.current.setSensorData('001', mockData);
    });

    expect(result.current.sensorData['001']).toEqual(mockData);
  });

  it('should add sensor readings without exceeding 288 points', () => {
    const { result } = renderHook(() => useDashboardStore());
    const mockData = generateMockSensorData('002');

    act(() => {
      result.current.setSensorData('002', mockData);
    });

    const newReading = {
      timestamp: dayjs().utc().toISOString(),
      temperature: 25.5,
      humidity: 65,
      light_level: 800,
      is_daytime: true,
    };

    act(() => {
      result.current.addSensorReading('002', newReading);
    });

    expect(result.current.sensorData['002']).toContain(newReading);
    expect(result.current.sensorData['002'].length).toBeLessThanOrEqual(288);
  });

  it('should filter sensors by location', () => {
    const { result } = renderHook(() => useDashboardStore());
    const mockSensors = generateMockSensors();

    act(() => {
      result.current.setSensors(mockSensors);
      result.current.setSelectedLocations(['North_Field', 'Tomato_Greenhouse']);
    });

    const filtered = result.current.getFilteredSensors();
    expect(filtered.length).toBe(2);
    expect(filtered.every((s) => ['North_Field', 'Tomato_Greenhouse'].includes(s.location))).toBe(true);
  });

  it('should filter data by time range', () => {
    const { result } = renderHook(() => useDashboardStore());
    const mockData = generateMockSensorData('001');

    act(() => {
      result.current.setSensorData('001', mockData);
      const oneHourAgo = dayjs().utc().subtract(1, 'hour');
      result.current.setTimeRange({
        startTime: oneHourAgo.toISOString(),
        endTime: dayjs().utc().toISOString(),
        label: 'Last hour',
      });
    });

    const filtered = result.current.getFilteredData('001');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(mockData.length);
  });

  it('should manage alerts correctly', () => {
    const { result } = renderHook(() => useDashboardStore());

    const mockAlert = {
      event_type: 'temperature_alert' as const,
      sensor_id: '001',
      value: 35.5,
      threshold: 35,
      timestamp: dayjs().utc().toISOString(),
      location: 'North_Field',
    };

    act(() => {
      result.current.addAlert(mockAlert);
    });

    expect(result.current.alerts).toContain(mockAlert);

    act(() => {
      result.current.clearAlerts();
    });

    expect(result.current.alerts).toEqual([]);
  });
});

describe('Mock Data Generation', () => {
  it('should generate 5 sensor nodes', () => {
    const sensors = generateMockSensors();
    expect(sensors).toHaveLength(5);
    expect(sensors.every((s) => s.id && s.location && typeof s.online === 'boolean')).toBe(true);
  });

  it('should generate 288 sensor readings for 24 hours', () => {
    const data = generateMockSensorData('001');
    expect(data.length).toBe(288); // 24 hours * 12 readings/hour
  });

  it('should generate valid sensor readings', () => {
    const data = generateMockSensorData('001');
    const reading = data[0];

    expect(reading.temperature).toBeGreaterThanOrEqual(15);
    expect(reading.temperature).toBeLessThanOrEqual(40);
    expect(reading.humidity).toBeGreaterThanOrEqual(0);
    expect(reading.humidity).toBeLessThanOrEqual(100);
    expect(reading.light_level).toBeGreaterThanOrEqual(0);
    expect(typeof reading.is_daytime).toBe('boolean');
  });
});
