import { useState, useEffect, useCallback, Suspense } from 'react';
import { DisasterLocation } from './types/disaster';
import { FilterState } from './components/FilterBar';
import Globe from './components/Globe';
import DisasterPanel from './components/DisasterPanel';
import FilterBar from './components/FilterBar';
import { BrowserUseAgent } from './services/browserUseAgent';
import { mockDisasters } from './data/mockDisasters';
import { Globe as GlobeIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import './App.css';

function App() {
  const [disasters, setDisasters] = useState<DisasterLocation[]>(mockDisasters);
  const [filteredDisasters, setFilteredDisasters] = useState<DisasterLocation[]>(mockDisasters);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    severities: [],
    dateRange: { start: null, end: null },
  });

  const browserAgent = new BrowserUseAgent();

  useEffect(() => {
    applyFilters();
  }, [disasters, filters, applyFilters]);

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

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      const newDisasters = await browserAgent.searchRecentDisasters();
      if (newDisasters.length > 0) {
        setDisasters([...mockDisasters, ...newDisasters]);
      }
    } catch (error) {
      console.error('Error fetching disasters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisasterClick = async (disaster: DisasterLocation) => {
    setSelectedDisaster(disaster);
    
    if (disaster.donationLinks.length === 0) {
      const donationLinks = await browserAgent.getDonationLinks(disaster.name, `${disaster.latitude},${disaster.longitude}`);
      setSelectedDisaster({
        ...disaster,
        donationLinks,
      });
    }
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
          <Suspense fallback={
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading Earth visualization...</p>
            </div>
          }>
            <Globe 
              disasters={filteredDisasters} 
              onDisasterClick={handleDisasterClick}
            />
          </Suspense>
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
