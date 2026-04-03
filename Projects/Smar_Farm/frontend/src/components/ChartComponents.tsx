/**
 * Chart components for displaying sensor data
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { SensorReading } from '../types/sensor';
import dayjs from 'dayjs';

interface ChartProps {
  data: SensorReading[];
  location: string;
  height?: number;
}

interface ChartDataPoint extends SensorReading {
  time: string;
}

const formatChartData = (readings: SensorReading[]): ChartDataPoint[] => {
  return readings.map((reading) => ({
    ...reading,
    time: dayjs(reading.timestamp).format('HH:mm'),
  }));
};

/**
 * Temperature chart component
 */
export const TemperatureChart: React.FC<ChartProps> = ({ data, location, height = 300 }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No temperature data available</p>
      </div>
    );
  }

  const chartData = formatChartData(data);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{location} - Temperature</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Temperature (°C)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Humidity chart component
 */
export const HumidityChart: React.FC<ChartProps> = ({ data, location, height = 300 }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No humidity data available</p>
      </div>
    );
  }

  const chartData = formatChartData(data);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{location} - Humidity</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" label={{ value: '%', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [`${value.toFixed(0)}%`, 'Humidity']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Humidity (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Light level chart component
 */
export const LightLevelChart: React.FC<ChartProps> = ({ data, location, height = 300 }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No light level data available</p>
      </div>
    );
  }

  const chartData = formatChartData(data);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{location} - Light Level</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" label={{ value: 'LUX', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [`${value.toFixed(0)} LUX`, 'Light Level']}
          />
          <Legend />
          <Bar dataKey="light_level" fill="#f59e0b" name="Light Level (LUX)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
