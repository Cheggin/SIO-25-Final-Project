import { useState } from 'react';
import { Filter, Calendar, AlertTriangle } from 'lucide-react';
import type { DisasterLocation } from '../types/disaster';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  types: DisasterLocation['type'][];
  severities: DisasterLocation['severity'][];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    severities: [],
    dateRange: { start: null, end: null },
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const disasterTypes: DisasterLocation['type'][] = [
    'wildfire', 'flood', 'hurricane', 'drought', 'heatwave', 'storm', 'earthquake', 'other'
  ];

  const severityLevels: DisasterLocation['severity'][] = [
    'low', 'moderate', 'high', 'critical'
  ];

  const handleTypeToggle = (type: DisasterLocation['type']) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    
    const newFilters = { ...filters, types: newTypes };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSeverityToggle = (severity: DisasterLocation['severity']) => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter(s => s !== severity)
      : [...filters.severities, severity];
    
    const newFilters = { ...filters, severities: newSeverities };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      types: [],
      severities: [],
      dateRange: { start: null, end: null },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="filter-bar">
      <button 
        className="filter-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter size={20} />
        Filters
        {(filters.types.length > 0 || filters.severities.length > 0) && (
          <span className="filter-count">
            {filters.types.length + filters.severities.length}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="filter-panel">
          <div className="filter-section">
            <h3>Disaster Type</h3>
            <div className="filter-chips">
              {disasterTypes.map(type => (
                <button
                  key={type}
                  className={`filter-chip ${filters.types.includes(type) ? 'active' : ''}`}
                  onClick={() => handleTypeToggle(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>
              <AlertTriangle size={16} />
              Severity
            </h3>
            <div className="filter-chips">
              {severityLevels.map(severity => (
                <button
                  key={severity}
                  className={`filter-chip severity-${severity} ${filters.severities.includes(severity) ? 'active' : ''}`}
                  onClick={() => handleSeverityToggle(severity)}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>
              <Calendar size={16} />
              Date Range
            </h3>
            <div className="date-inputs">
              <input
                type="date"
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                  };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
              />
              <span>to</span>
              <input
                type="date"
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                  };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
              />
            </div>
          </div>

          <button className="clear-filters" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}