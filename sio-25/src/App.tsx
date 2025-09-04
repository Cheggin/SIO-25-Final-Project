import { useState, useEffect, useCallback } from 'react';
import type { DisasterLocation } from './types/disaster';
import type { FilterState } from './components/FilterBar';
import Globe from './components/Globe';
import DisasterPanel from './components/DisasterPanel';
import FilterBar from './components/FilterBar';
import DisasterTable from './components/DisasterTable';
import DisasterCharts from './components/DisasterCharts';
import { EmdatService } from './services/emdatService';
import { EONETService } from './services/eonetService';
import { USGSService } from './services/usgsService';
import { DisasterMerger } from './services/disasterMerger';
import { Globe as GlobeIcon, RefreshCw, AlertTriangle, Table, BarChart3 } from 'lucide-react';
import './App.css';
import './components/DisasterTable.css';
import './components/DisasterCharts.css';

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
  const [currentView, setCurrentView] = useState<'globe' | 'table' | 'charts'>('globe');


  useEffect(() => {
    const loadMultiSourceData = async () => {
      setIsLoading(true);
      try {
        console.log('Loading disaster data from multiple sources...');
        
        // Load data from all sources in parallel for better performance
        const [emdatDisasters, eonetDisasters, usgsDisasters] = await Promise.allSettled([
          // Load historical data from EM-DAT
          EmdatService.loadFromFile('/emdat-data-2000-2025.xlsx').then(disasters => 
            disasters.filter(disaster => {
              const disasterYear = new Date(disaster.date).getFullYear();
              return disasterYear >= 2000 && disasterYear <= 2025;
            })
          ),
          
          // Load recent active events from NASA EONET (last 30 days)
          EONETService.fetchRecentEvents(30),
          
          // Load recent earthquakes from USGS (last 14 days, magnitude 4.5+)
          USGSService.fetchRecentEarthquakes({ days: 14, minMagnitude: 4.5 })
        ]);
        
        // Extract successful results
        const emdat = emdatDisasters.status === 'fulfilled' ? emdatDisasters.value : [];
        const eonet = eonetDisasters.status === 'fulfilled' ? eonetDisasters.value : [];
        const usgs = usgsDisasters.status === 'fulfilled' ? usgsDisasters.value : [];
        
        // Log any failed requests
        if (emdatDisasters.status === 'rejected') {
          console.error('EM-DAT loading failed:', emdatDisasters.reason);
        }
        if (eonetDisasters.status === 'rejected') {
          console.error('NASA EONET loading failed:', eonetDisasters.reason);
        }
        if (usgsDisasters.status === 'rejected') {
          console.error('USGS loading failed:', usgsDisasters.reason);
        }
        
        console.log(`Raw data loaded: EM-DAT (${emdat.length}), NASA EONET (${eonet.length}), USGS (${usgs.length})`);
        
        // Merge all sources and remove duplicates
        const { disasters: mergedDisasters, stats } = DisasterMerger.mergeSources(emdat, eonet, usgs);
        
        console.log('Merger complete:', {
          total: stats.totalEvents,
          unique: mergedDisasters.length,
          duplicatesRemoved: stats.duplicatesRemoved,
          sources: stats.sourceBreakdown,
          types: stats.typeBreakdown
        });
        
        setDisasters(mergedDisasters);
        
      } catch (error) {
        console.error('Error loading multi-source disaster data:', error);
        
        // Fallback: try to load just EM-DAT data
        try {
          console.log('Falling back to EM-DAT only...');
          const emdatDisasters = await EmdatService.loadFromFile('/emdat-data-2000-2025.xlsx');
          const disastersFrom2000 = emdatDisasters.filter(disaster => {
            const disasterYear = new Date(disaster.date).getFullYear();
            return disasterYear >= 2000 && disasterYear <= 2025;
          });
          setDisasters(disastersFrom2000);
          console.log(`Fallback: Loaded ${disastersFrom2000.length} disasters from EM-DAT only`);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setDisasters([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMultiSourceData();
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
          <div className="view-toggle">
            <button 
              className={`view-button ${currentView === 'globe' ? 'active' : ''}`}
              onClick={() => setCurrentView('globe')}
              title="Globe View"
            >
              <GlobeIcon size={20} />
              Globe
            </button>
            <button 
              className={`view-button ${currentView === 'table' ? 'active' : ''}`}
              onClick={() => setCurrentView('table')}
              title="Table View"
            >
              <Table size={20} />
              Table
            </button>
            <button 
              className={`view-button ${currentView === 'charts' ? 'active' : ''}`}
              onClick={() => setCurrentView('charts')}
              title="Charts View"
            >
              <BarChart3 size={20} />
              Charts
            </button>
          </div>
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
            <span className="stat-label">Recorded Disasters</span>
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

        <div className="content-wrapper">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading disaster data from multiple sources...</p>
            </div>
          ) : (
            <>
              {currentView === 'globe' && (
                <div className="globe-wrapper">
                  <Globe 
                    disasters={filteredDisasters} 
                    onDisasterClick={handleDisasterClick}
                  />
                </div>
              )}
              
              {currentView === 'table' && (
                <DisasterTable 
                  disasters={filteredDisasters} 
                  onDisasterClick={handleDisasterClick}
                />
              )}
              
              {currentView === 'charts' && (
                <DisasterCharts 
                  disasters={filteredDisasters}
                />
              )}
            </>
          )}
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