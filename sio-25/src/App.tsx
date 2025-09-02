import { useState, useEffect, useCallback } from 'react';
import type { DisasterLocation } from './types/disaster';
import type { FilterState } from './components/FilterBar';
import Globe from './components/Globe';
import DisasterPanel from './components/DisasterPanel';
import FilterBar from './components/FilterBar';
import { EmdatService } from './services/emdatService';
import { Globe as GlobeIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import './App.css';

function App() {
  const [disasters, setDisasters] = useState<DisasterLocation[]>([]);
  const [filteredDisasters, setFilteredDisasters] = useState<DisasterLocation[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    severities: [],
    dateRange: { start: null, end: null },
  });


  useEffect(() => {
    const loadEmdatData = async () => {
      setIsLoading(true);
      try {
        const emdatDisasters = await EmdatService.loadFromFile('/emdat-data-2000-2025.xlsx');
        
        // Show all disasters from 2000-2025
        const disastersFrom2000 = emdatDisasters.filter(disaster => {
          const disasterYear = new Date(disaster.date).getFullYear();
          return disasterYear >= 2000 && disasterYear <= 2025;
        });
        
        console.log(`Loaded ${disastersFrom2000.length} disasters from 2000-2025`);
        setDisasters(disastersFrom2000);
      } catch (error) {
        console.error('Error loading EMDAT data:', error);
        setDisasters([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmdatData();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...disasters];

    if (filters.types.length > 0) {
      filtered = filtered.filter(d => filters.types.includes(d.type));
    }

    if (filters.severities.length > 0) {
      filtered = filtered.filter(d => filters.severities.includes(d.severity));
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(d => new Date(d.date) >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(d => new Date(d.date) <= filters.dateRange.end!);
    }

    setFilteredDisasters(filtered);
  }, [disasters, filters]);

  useEffect(() => {
    applyFilters();
  }, [disasters, filters, applyFilters]);

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      // Reload EMDAT data
      const emdatDisasters = await EmdatService.loadFromFile('/emdat-data.xlsx');
      
      // Show all disasters from 2024-2025
      const disasters2024onwards = emdatDisasters.filter(disaster => {
        const disasterYear = new Date(disaster.date).getFullYear();
        return disasterYear >= 2024;
      });
      
      console.log(`Refreshed: ${disasters2024onwards.length} disasters from 2024-2025`);
      setDisasters(disasters2024onwards);
    } catch (error) {
      console.error('Error refreshing disasters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisasterClick = (disaster: DisasterLocation) => {
    setSelectedDisaster(disaster);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <GlobeIcon size={32} className="app-icon" />
            <h1>Climate Crisis Tracker</h1>
          </div>
          <p className="tagline">Visualizing climate disasters and connecting relief efforts worldwide</p>
        </div>
        <div className="header-actions">
          <FilterBar onFilterChange={setFilters} />
          <button 
            className="refresh-button" 
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            <RefreshCw size={20} className={isLoading ? 'spinning' : ''} />
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="stats-bar">
          <div className="stat-item">
            <AlertTriangle size={20} />
            <span className="stat-value">{filteredDisasters.length}</span>
            <span className="stat-label">Active Disasters</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {filteredDisasters.reduce((sum, d) => sum + d.affectedPeople, 0).toLocaleString()}
            </span>
            <span className="stat-label">People Affected</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {filteredDisasters.filter(d => d.severity === 'critical').length}
            </span>
            <span className="stat-label">Critical Events</span>
          </div>
        </div>

        <div className="globe-wrapper">
          <Globe 
            disasters={filteredDisasters} 
            onDisasterClick={handleDisasterClick}
          />
        </div>

        <DisasterPanel 
          disaster={selectedDisaster} 
          onClose={() => setSelectedDisaster(null)}
        />
      </main>

      <footer className="app-footer">
        <p>Data sources: Relief agencies, meteorological services, and environmental organizations</p>
        <p>© 2024 Climate Crisis Tracker - Raising awareness for climate action</p>
      </footer>
    </div>
  );
}

export default App