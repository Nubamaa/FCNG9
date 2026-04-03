/**
 * Main Dashboard component
 * Displays sensor nodes, real-time data charts, and alerts
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import apiClient from '../services/apiClient';
import { SensorReading } from '../types/sensor';
import SensorNodeCard from './SensorNodeCard';
import { TemperatureChart, HumidityChart, LightLevelChart } from './ChartComponents';
import AlertPanel from './AlertPanel';
import FilterPanel from './FilterPanel';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const Dashboard: React.FC = () => {
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    sensors,
    sensorData,
    alerts,
    selectedLocations,
    timeRange,
    isLoading,
    error,
    setSensors,
    setSensorData,
    addSensorReading,
    setAlerts,
    addAlert,
    clearAlerts,
    setSelectedLocations,
    setTimeRange,
    setIsLoading,
    setError,
    getFilteredSensors,
    getFilteredData,
  } = useDashboardStore();

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch sensor list
        const sensorsList = await apiClient.fetchSensors();
        setSensors(sensorsList);

        // Set default selected locations to all locations
        const allLocations = sensorsList.map((s) => s.location);
        setSelectedLocations(allLocations);

        // Fetch data for all sensors
        for (const sensor of sensorsList) {
          try {
            const data = await apiClient.fetchSensorData(sensor.id, timeRange);
            setSensorData(sensor.id, data);
          } catch (err) {
            console.error(`Error loading data for sensor ${sensor.id}`, err);
          }
        }

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load sensor data');
        console.error('Error loading initial data:', err);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (sensors.length === 0) {
      return;
    }

    setIsUpdating(true);
    const sensorIds = sensors.map((s) => s.id);

    const unsubscribeUpdates = apiClient.subscribeToUpdates(
      sensorIds,
      (sensorId, reading) => {
        if (reading) {
          addSensorReading(sensorId, reading);
        }
      },
      5000 // Update every 5 seconds
    );

    const unsubscribeAlerts = apiClient.subscribeToAlerts((alert) => {
      addAlert(alert);
    }, 10000);

    // Initial alert load
    const initialAlerts = []; // Could load from API if needed
    setAlerts(initialAlerts);

    return () => {
      unsubscribeUpdates();
      unsubscribeAlerts();
    };
  }, [sensors]);

  const filteredSensors = getFilteredSensors();
  const selectedSensor = sensors.find((s) => s.id === selectedSensorId);
  const selectedSensorData = selectedSensorId ? getFilteredData(selectedSensorId) : [];

  const handleLocationFilterChange = useCallback((locations: string[]) => {
    setSelectedLocations(locations);
  }, [setSelectedLocations]);

  const handleTimeRangeChange = useCallback((newTimeRange) => {
    setTimeRange(newTimeRange);
  }, [setTimeRange]);

  const handleSelectSensor = useCallback((sensorId: string) => {
    setSelectedSensorId(selectedSensorId === sensorId ? null : sensorId);
  }, [selectedSensorId]);

  if (isLoading && sensors.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Farm Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Real-time monitoring of 5 sensor nodes</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                API Mode: <span className="font-semibold">{apiClient.isUsingMockData() ? 'Mock Data' : 'Live'}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Updated at {dayjs().format('HH:mm:ss')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <FilterPanel
              locations={sensors.map((s) => s.location)}
              selectedLocations={selectedLocations}
              currentTimeRange={timeRange}
              onLocationChange={handleLocationFilterChange}
              onTimeRangeChange={handleTimeRangeChange}
            />

            <AlertPanel alerts={alerts} onClear={clearAlerts} maxHeight={300} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sensor Nodes Grid */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sensor Nodes ({filteredSensors.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSensors.map((sensor) => (
                  <SensorNodeCard
                    key={sensor.id}
                    sensor={sensor}
                    isSelected={selectedSensorId === sensor.id}
                    onSelect={() => handleSelectSensor(sensor.id)}
                  />
                ))}
              </div>
            </div>

            {/* Selected Sensor Details */}
            {selectedSensor && selectedSensorData.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedSensor.location} - Detailed Analysis
                </h2>

                {/* Current Reading Summary */}
                {selectedSensorData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-sm text-gray-600 mb-1">Temperature</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {selectedSensorData[selectedSensorData.length - 1].temperature.toFixed(1)}°C
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-sm text-gray-600 mb-1">Humidity</p>
                      <p className="text-3xl font-bold text-green-600">
                        {selectedSensorData[selectedSensorData.length - 1].humidity}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-sm text-gray-600 mb-1">Light Level</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {selectedSensorData[selectedSensorData.length - 1].light_level} LUX
                      </p>
                    </div>
                  </div>
                )}

                {/* Charts */}
                <TemperatureChart data={selectedSensorData} location={selectedSensor.location} />
                <HumidityChart data={selectedSensorData} location={selectedSensor.location} />
                <LightLevelChart data={selectedSensorData} location={selectedSensor.location} />
              </div>
            )}

            {/* No Selection */}
            {!selectedSensor && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg">
                  Select a sensor node to view detailed charts and analytics
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>Smart Farm IoT Dashboard © 2026 - Real-time sensor monitoring system</p>
          <p className="mt-2 text-xs text-gray-500">
            Request log entries: {apiClient.getRequestLog().length}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
