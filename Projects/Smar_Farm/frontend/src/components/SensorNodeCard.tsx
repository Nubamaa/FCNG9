/**
 * SensorNodeCard component - displays individual sensor status
 */

import React from 'react';
import { SensorNode } from '../types/sensor';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface SensorNodeCardProps {
  sensor: SensorNode;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const SensorNodeCard: React.FC<SensorNodeCardProps> = ({
  sensor,
  isSelected = false,
  onSelect,
  className = '',
}) => {
  const statusColor = sensor.online ? 'bg-healthy' : 'bg-offline';
  const statusText = sensor.online ? 'Online' : 'Offline';
  const timeSinceTransmission = dayjs(sensor.last_transmission).fromNow();

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${className}
        shadow-sm hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{sensor.location}</h3>
          <p className="text-sm text-gray-500">ID: {sensor.id}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${statusColor}`}>
          {statusText}
        </div>
      </div>
      
      <div className="flex items-center text-sm text-gray-600">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusColor}`}></span>
        <p>Last transmission: {timeSinceTransmission}</p>
      </div>
    </div>
  );
};

export default SensorNodeCard;
