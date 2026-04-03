/**
 * Zustand store for managing dashboard state
 */

import { create } from 'zustand';
import { SensorNode, SensorReading, Alert, FilterOptions, TimeRange } from '../types/sensor';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

interface DashboardState {
  // Data
  sensors: SensorNode[];
  sensorData: Record<string, SensorReading[]>;
  alerts: Alert[];

  // UI State
  selectedLocations: string[];
  timeRange: TimeRange;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSensors: (sensors: SensorNode[]) => void;
  setSensorData: (sensorId: string, data: SensorReading[]) => void;
  addSensorReading: (sensorId: string, reading: SensorReading | null) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;
  setSelectedLocations: (locations: string[]) => void;
  setTimeRange: (timeRange: TimeRange) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  getFilteredSensors: () => SensorNode[];
  getFilteredData: (sensorId: string) => SensorReading[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  sensors: [],
  sensorData: {},
  alerts: [],
  selectedLocations: [],
  timeRange: {
    startTime: dayjs().utc().subtract(24, 'hours').toISOString(),
    endTime: dayjs().utc().toISOString(),
    label: 'Last 24 hours',
  },
  isLoading: false,
  error: null,

  setSensors: (sensors) => set({ sensors }),

  setSensorData: (sensorId, data) =>
    set((state) => ({
      sensorData: {
        ...state.sensorData,
        [sensorId]: data,
      },
    })),

  addSensorReading: (sensorId, reading) =>
    set((state) => {
      if (!reading) {
        // No data transmission (likely nighttime)
        return state;
      }

      const currentData = state.sensorData[sensorId] || [];
      const updatedData = [...currentData, reading];

      // Keep only last 288 readings
      if (updatedData.length > 288) {
        updatedData.shift();
      }

      return {
        sensorData: {
          ...state.sensorData,
          [sensorId]: updatedData,
        },
      };
    }),

  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) =>
    set((state) => {
      const newAlerts = [alert, ...state.alerts];
      // Keep only last 50 alerts
      if (newAlerts.length > 50) {
        newAlerts.pop();
      }
      return { alerts: newAlerts };
    }),

  clearAlerts: () => set({ alerts: [] }),

  setSelectedLocations: (locations) =>
    set({ selectedLocations: locations.length === 0 ? get().sensors.map((s) => s.location) : locations }),

  setTimeRange: (timeRange) => set({ timeRange }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  getFilteredSensors: () => {
    const state = get();
    const locations = state.selectedLocations.length === 0
      ? state.sensors.map((s) => s.location)
      : state.selectedLocations;

    return state.sensors.filter((sensor) => locations.includes(sensor.location));
  },

  getFilteredData: (sensorId) => {
    const state = get();
    const data = state.sensorData[sensorId] || [];

    return data.filter((reading) => {
      const timestamp = dayjs(reading.timestamp);
      return (
        timestamp.isAfter(dayjs(state.timeRange.startTime)) &&
        timestamp.isBefore(dayjs(state.timeRange.endTime))
      );
    });
  },
}));
