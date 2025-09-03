import { useState, useMemo } from 'react';
import type { DisasterLocation } from '../types/disaster';
import { 
  Calendar, 
  MapPin, 
  Users, 
  AlertTriangle, 
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Search
} from 'lucide-react';

interface DisasterTableProps {
  disasters: DisasterLocation[];
  onDisasterClick: (disaster: DisasterLocation) => void;
}

type SortField = 'date' | 'name' | 'type' | 'severity' | 'affectedPeople' | 'magnitude';
type SortOrder = 'asc' | 'desc';

const DisasterTable = ({ disasters, onDisasterClick }: DisasterTableProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter disasters based on search term
  const filteredDisasters = useMemo(() => {
    if (!searchTerm) return disasters;
    
    const term = searchTerm.toLowerCase();
    return disasters.filter(disaster => 
      disaster.name.toLowerCase().includes(term) ||
      disaster.type.toLowerCase().includes(term) ||
      disaster.summary.toLowerCase().includes(term) ||
      (disaster.source && disaster.source.toLowerCase().includes(term))
    );
  }, [disasters, searchTerm]);

  // Sort disasters
  const sortedDisasters = useMemo(() => {
    return [...filteredDisasters].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'date': {
          aValue = a.date.getTime();
          bValue = b.date.getTime();
          break;
        }
        case 'name': {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        }
        case 'type': {
          aValue = a.type;
          bValue = b.type;
          break;
        }
        case 'severity': {
          const severityOrder = { 'critical': 4, 'high': 3, 'moderate': 2, 'low': 1 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        }
        case 'affectedPeople': {
          aValue = a.affectedPeople;
          bValue = b.affectedPeople;
          break;
        }
        case 'magnitude': {
          aValue = a.magnitude || 0;
          bValue = b.magnitude || 0;
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDisasters, sortField, sortOrder]);

  // Paginate disasters
  const paginatedDisasters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedDisasters.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedDisasters, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedDisasters.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSeverityColor = (severity: DisasterLocation['severity']) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'moderate': return '#eab308';
      case 'low': return '#22c55e';
    }
  };

  const getTypeColor = (type: DisasterLocation['type']) => {
    switch (type) {
      case 'wildfire': return '#ff4444';
      case 'flood': return '#4444ff';
      case 'hurricane': return '#8844ff';
      case 'drought': return '#ff8844';
      case 'heatwave': return '#ff6644';
      case 'storm': return '#6644ff';
      case 'earthquake': return '#884444';
      case 'volcano': return '#ff2200';
      default: return '#888888';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="table-sort-button"
      title={`Sort by ${field}`}
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
      )}
    </button>
  );

  return (
    <div className="disaster-table-container">
      {/* Search and Controls */}
      <div className="table-controls">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search disasters..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="search-input"
          />
        </div>
        <div className="table-stats">
          Showing {paginatedDisasters.length} of {sortedDisasters.length} disasters
          {searchTerm && ` (filtered from ${disasters.length} total)`}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="disaster-table">
          <thead>
            <tr>
              <th>
                <SortButton field="name">Event</SortButton>
              </th>
              <th>
                <SortButton field="type">Type</SortButton>
              </th>
              <th>
                <SortButton field="date">Date</SortButton>
              </th>
              <th>
                <SortButton field="severity">Severity</SortButton>
              </th>
              <th>
                <SortButton field="affectedPeople">Affected</SortButton>
              </th>
              <th>
                <SortButton field="magnitude">Magnitude</SortButton>
              </th>
              <th>Location</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDisasters.map((disaster) => (
              <tr key={disaster.id} className="table-row">
                <td className="event-cell">
                  <div className="event-info">
                    <div className="event-name">{disaster.name}</div>
                    <div className="event-summary">{disaster.summary.substring(0, 100)}...</div>
                  </div>
                </td>
                <td>
                  <span 
                    className="type-badge" 
                    style={{ backgroundColor: getTypeColor(disaster.type) + '20', color: getTypeColor(disaster.type), borderColor: getTypeColor(disaster.type) + '40' }}
                  >
                    {disaster.type}
                  </span>
                </td>
                <td className="date-cell">
                  <div className="date-info">
                    <Calendar size={16} />
                    <span>{disaster.date.toLocaleDateString()}</span>
                  </div>
                </td>
                <td>
                  <span 
                    className="severity-badge" 
                    style={{ backgroundColor: getSeverityColor(disaster.severity) + '20', color: getSeverityColor(disaster.severity), borderColor: getSeverityColor(disaster.severity) + '40' }}
                  >
                    {disaster.severity}
                  </span>
                </td>
                <td className="affected-cell">
                  {disaster.affectedPeople > 0 ? (
                    <div className="affected-info">
                      <Users size={16} />
                      <span>{formatNumber(disaster.affectedPeople)}</span>
                    </div>
                  ) : (
                    <div className="affected-info no-data">
                      <span>—</span>
                    </div>
                  )}
                </td>
                <td className="magnitude-cell">
                  {disaster.magnitude && (
                    <div className="magnitude-info">
                      <AlertTriangle size={16} />
                      <span>M{disaster.magnitude}</span>
                    </div>
                  )}
                </td>
                <td className="location-cell">
                  <div className="location-info">
                    <MapPin size={16} />
                    <span>{disaster.latitude.toFixed(2)}, {disaster.longitude.toFixed(2)}</span>
                  </div>
                </td>
                <td className="source-cell">
                  <span className="source-badge">{disaster.source}</span>
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => onDisasterClick(disaster)}
                    className="action-button view-button"
                    title="View details"
                  >
                    View
                  </button>
                  {disaster.sourceUrl && (
                    <a
                      href={disaster.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-button external-button"
                      title="View source"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {paginatedDisasters.length === 0 && (
        <div className="empty-state">
          <AlertTriangle size={48} />
          <h3>No disasters found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
};

export default DisasterTable;