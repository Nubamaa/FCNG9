/**
 * Alert panel component
 */

import React from 'react';
import { Alert } from '../types/sensor';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface AlertPanelProps {
  alerts: Alert[];
  onClear?: () => void;
  maxHeight?: number;
}

const getAlertColor = (eventType: Alert['event_type']) => {
  switch (eventType) {
    case 'temperature_alert':
      return 'bg-red-50 border-red-200';
    case 'offline_alert':
      return 'bg-gray-50 border-gray-200';
    case 'humidity_alert':
      return 'bg-yellow-50 border-yellow-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getAlertIcon = (eventType: Alert['event_type']) => {
  switch (eventType) {
    case 'temperature_alert':
      return '🌡️';
    case 'offline_alert':
      return '📡';
    case 'humidity_alert':
      return '💧';
    default:
      return '⚠️';
  }
};

const getAlertMessage = (alert: Alert) => {
  switch (alert.event_type) {
    case 'temperature_alert':
      return `Temperature ${alert.value}°C exceeds threshold of ${alert.threshold}°C`;
    case 'offline_alert':
      return `Sensor is offline`;
    case 'humidity_alert':
      return `Humidity ${alert.value}% exceeds threshold of ${alert.threshold}%`;
    default:
      return 'Alert triggered';
  }
};

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onClear, maxHeight = 400 }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Alerts {alerts.length > 0 && <span className="text-red-600">({alerts.length})</span>}
        </h3>
        {alerts.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-gray-500">No alerts at the moment</p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {alerts.map((alert, index) => (
            <div
              key={`${alert.sensor_id}-${alert.timestamp}-${index}`}
              className={`border-b border-gray-100 p-4 ${getAlertColor(alert.event_type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-1">
                  {getAlertIcon(alert.event_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{alert.location}</p>
                  <p className="text-sm text-gray-700">{getAlertMessage(alert)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {dayjs(alert.timestamp).fromNow()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
