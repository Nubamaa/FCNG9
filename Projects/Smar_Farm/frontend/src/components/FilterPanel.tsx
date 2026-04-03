/**
 * Filter panel component
 */

import React, { useMemo } from 'react';
import { FilterOptions, TimeRange } from '../types/sensor';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

interface FilterPanelProps {
  locations: string[];
  selectedLocations: string[];
  currentTimeRange: TimeRange;
  onLocationChange: (locations: string[]) => void;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

const PRESET_TIME_RANGES: TimeRange[] = [
  {
    startTime: dayjs().utc().subtract(6, 'hours').toISOString(),
    endTime: dayjs().utc().toISOString(),
    label: 'Last 6 hours',
  },
  {
    startTime: dayjs().utc().subtract(24, 'hours').toISOString(),
    endTime: dayjs().utc().toISOString(),
    label: 'Last 24 hours',
  },
  {
    startTime: dayjs().utc().subtract(7, 'days').toISOString(),
    endTime: dayjs().utc().toISOString(),
    label: 'Last 7 days',
  },
  {
    startTime: dayjs().utc().subtract(30, 'days').toISOString(),
    endTime: dayjs().utc().toISOString(),
    label: 'Last 30 days',
  },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  locations,
  selectedLocations,
  currentTimeRange,
  onLocationChange,
  onTimeRangeChange,
}) => {
  const handleLocationToggle = (location: string) => {
    const newLocations = selectedLocations.includes(location)
      ? selectedLocations.filter((l) => l !== location)
      : [...selectedLocations, location];
    onLocationChange(newLocations);
  };

  const handleSelectAll = () => {
    onLocationChange(locations);
  };

  const handleClearAll = () => {
    onLocationChange([]);
  };

  const isTimeRangeSelected = (range: TimeRange) => {
    return (
      range.startTime === currentTimeRange.startTime &&
      range.endTime === currentTimeRange.endTime
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="space-y-4">
        {/* Locations Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Locations</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
              >
                All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                None
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {locations.map((location) => (
              <label key={location} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{location}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Time Range Filter */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Time Range</h3>
          <div className="space-y-2">
            {PRESET_TIME_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => onTimeRangeChange(range)}
                className={`block w-full px-3 py-2 rounded text-sm transition-colors ${
                  isTimeRangeSelected(range)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range (optional) */}
        <div>
          <label className="text-sm text-gray-600">
            Custom range: {dayjs(currentTimeRange.startTime).format('MMM DD')} -{' '}
            {dayjs(currentTimeRange.endTime).format('MMM DD')}
          </label>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
