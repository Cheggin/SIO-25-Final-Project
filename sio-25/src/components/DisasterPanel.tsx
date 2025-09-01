import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Users, Calendar, AlertTriangle, Heart } from 'lucide-react';
import type { DisasterLocation } from '../types/disaster';

interface DisasterPanelProps {
  disaster: DisasterLocation | null;
  onClose: () => void;
}

export default function DisasterPanel({ disaster, onClose }: DisasterPanelProps) {
  if (!disaster) return null;

  const getSeverityColor = (severity: DisasterLocation['severity']) => {
    const colors = {
      low: '#22c55e',
      moderate: '#eab308',
      high: '#f97316',
      critical: '#ef4444',
    };
    return colors[severity];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  return (
    <AnimatePresence>
      {disaster && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="disaster-panel"
        >
          <div className="panel-header">
            <h2>{disaster.name}</h2>
            <button onClick={onClose} className="close-button">
              <X size={24} />
            </button>
          </div>

          {disaster.imageUrl && (
            <div className="disaster-image">
              <img src={disaster.imageUrl} alt={disaster.name} />
            </div>
          )}

          <div className="disaster-info">
            <div className="info-badge" style={{ backgroundColor: getSeverityColor(disaster.severity) }}>
              <AlertTriangle size={16} />
              <span>{disaster.severity.toUpperCase()}</span>
            </div>

            <div className="info-row">
              <Calendar size={16} />
              <span>{formatDate(disaster.date)}</span>
            </div>

            <div className="info-row">
              <Users size={16} />
              <span>{formatNumber(disaster.affectedPeople)} people affected</span>
            </div>

            <div className="disaster-type-badge">
              {disaster.type.charAt(0).toUpperCase() + disaster.type.slice(1)}
            </div>
          </div>

          <div className="disaster-summary">
            <h3>Summary</h3>
            <p>{disaster.summary}</p>
            {disaster.source && (
              <p className="source">Source: {disaster.source}</p>
            )}
          </div>

          {disaster.donationLinks.length > 0 && (
            <div className="donation-section">
              <h3>
                <Heart size={20} />
                How to Help
              </h3>
              <div className="donation-links">
                {disaster.donationLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="donation-link"
                  >
                    <div className="donation-link-content">
                      <h4>{link.organization}</h4>
                      <p>{link.description}</p>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="panel-footer">
            <p className="coordinates">
              Coordinates: {disaster.latitude.toFixed(2)}°, {disaster.longitude.toFixed(2)}°
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}