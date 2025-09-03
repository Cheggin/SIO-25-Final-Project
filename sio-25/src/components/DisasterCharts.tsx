import { useMemo } from 'react';
import type { DisasterLocation } from '../types/disaster';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  Globe,
  Activity
} from 'lucide-react';

interface DisasterChartsProps {
  disasters: DisasterLocation[];
}

const DisasterCharts = ({ disasters }: DisasterChartsProps) => {
  
  // Calculate statistics
  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const severityCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    const yearCount: Record<number, number> = {};
    const monthCount: Record<number, number> = {};
    
    let totalAffected = 0;
    let totalWithMagnitude = 0;
    let magnitudeSum = 0;

    disasters.forEach(disaster => {
      // Type distribution
      typeCount[disaster.type] = (typeCount[disaster.type] || 0) + 1;
      
      // Severity distribution
      severityCount[disaster.severity] = (severityCount[disaster.severity] || 0) + 1;
      
      // Source distribution
      const source = disaster.source || 'Unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
      
      // Year distribution
      const year = disaster.date.getFullYear();
      yearCount[year] = (yearCount[year] || 0) + 1;
      
      // Month distribution (for seasonal analysis)
      const month = disaster.date.getMonth();
      monthCount[month] = (monthCount[month] || 0) + 1;
      
      // Affected people
      totalAffected += disaster.affectedPeople;
      
      // Magnitude average (for earthquakes)
      if (disaster.magnitude) {
        magnitudeSum += disaster.magnitude;
        totalWithMagnitude++;
      }
    });

    return {
      typeCount,
      severityCount,
      sourceCount,
      yearCount,
      monthCount,
      totalAffected,
      averageMagnitude: totalWithMagnitude > 0 ? magnitudeSum / totalWithMagnitude : 0,
      totalEvents: disasters.length
    };
  }, [disasters]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'wildfire': '#ff4444',
      'flood': '#4444ff',
      'hurricane': '#8844ff',
      'drought': '#ff8844',
      'heatwave': '#ff6644',
      'storm': '#6644ff',
      'earthquake': '#884444',
      'volcano': '#ff2200',
      'other': '#888888'
    };
    return colors[type] || '#888888';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'critical': '#ef4444',
      'high': '#f97316',
      'moderate': '#eab308',
      'low': '#22c55e'
    };
    return colors[severity] || '#888888';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Create chart data
  const typeData = Object.entries(stats.typeCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);

  const severityData = Object.entries(stats.severityCount)
    .sort(([,a], [,b]) => b - a);

  const sourceData = Object.entries(stats.sourceCount)
    .sort(([,a], [,b]) => b - a);

  const yearData = Object.entries(stats.yearCount)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .slice(-10); // Last 10 years

  // Ensure all 12 months are represented in chronological order
  const monthData: [string, number][] = monthNames.map((monthName, index) => [
    monthName, 
    stats.monthCount[index] || 0
  ]);

  // Chart component helpers
  const BarChart = ({ data, title, icon: Icon, getColor, maxHeight = 200 }: {
    data: [string, number][];
    title: string;
    icon: React.ComponentType<{ size?: number }>;
    getColor?: (key: string) => string;
    maxHeight?: number;
  }) => {
    const maxValue = Math.max(...data.map(([, value]) => value));
    
    return (
      <div className="chart-container">
        <div className="chart-header">
          <Icon size={20} />
          <h3>{title}</h3>
        </div>
        <div className="bar-chart" style={{ maxHeight }}>
          {data.map(([key, value]) => (
            <div key={key} className="bar-item">
              <div className="bar-label">{key}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${(value / maxValue) * 100}%`,
                    backgroundColor: getColor ? getColor(key) : '#00b4d8'
                  }}
                />
                <span className="bar-value">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChartComponent = ({ data, title, icon: Icon, getColor }: {
    data: [string, number][];
    title: string;
    icon: React.ComponentType<{ size?: number }>;
    getColor?: (key: string) => string;
  }) => {
    const total = data.reduce((sum, [, value]) => sum + value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="chart-container">
        <div className="chart-header">
          <Icon size={20} />
          <h3>{title}</h3>
        </div>
        <div className="pie-chart">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {data.map(([key, value]) => {
              const percentage = (value / total) * 100;
              const startAngle = (cumulativePercentage / 100) * 360 - 90;
              const endAngle = ((cumulativePercentage + percentage) / 100) * 360 - 90;
              
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              
              const x1 = 100 + 80 * Math.cos(startAngleRad);
              const y1 = 100 + 80 * Math.sin(startAngleRad);
              const x2 = 100 + 80 * Math.cos(endAngleRad);
              const y2 = 100 + 80 * Math.sin(endAngleRad);

              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              const result = (
                <path
                  key={key}
                  d={pathData}
                  fill={getColor ? getColor(key) : '#00b4d8'}
                  stroke="#000814"
                  strokeWidth="2"
                />
              );

              cumulativePercentage += percentage;
              return result;
            })}
          </svg>
          <div className="pie-legend">
            {data.map(([key, value]) => (
              <div key={key} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: getColor ? getColor(key) : '#00b4d8' }}
                />
                <span className="legend-label">{key}</span>
                <span className="legend-value">{value} ({((value / total) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = '#00b4d8' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ size?: number }>;
    color?: string;
  }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <div className="charts-container">
      {/* Summary Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={AlertTriangle}
          color="#00b4d8"
        />
        <StatCard
          title="People Affected"
          value={formatNumber(stats.totalAffected)}
          subtitle="Across all events"
          icon={Globe}
          color="#22c55e"
        />
        <StatCard
          title="Average Magnitude"
          value={stats.averageMagnitude.toFixed(1)}
          subtitle="For earthquakes"
          icon={Activity}
          color="#f97316"
        />
        <StatCard
          title="Data Sources"
          value={Object.keys(stats.sourceCount).length}
          subtitle="Different providers"
          icon={BarChart3}
          color="#8844ff"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Disaster Types */}
        <BarChart
          data={typeData}
          title="Disaster Types"
          icon={BarChart3}
          getColor={getTypeColor}
        />

        {/* Severity Distribution */}
        <PieChartComponent
          data={severityData}
          title="Severity Distribution"
          icon={PieChart}
          getColor={getSeverityColor}
        />

        {/* Yearly Trends */}
        <BarChart
          data={yearData}
          title="Events by Year"
          icon={TrendingUp}
          maxHeight={300}
        />

        {/* Seasonal Patterns */}
        <BarChart
          data={monthData}
          title="Seasonal Distribution (All Months)"
          icon={Calendar}
        />

        {/* Data Sources */}
        <BarChart
          data={sourceData}
          title="Data Sources"
          icon={Globe}
        />

        {/* Regional Activity (placeholder for future enhancement) */}
        <div className="chart-container">
          <div className="chart-header">
            <Globe size={20} />
            <h3>Global Coverage</h3>
          </div>
          <div className="coverage-stats">
            <div className="coverage-item">
              <span className="coverage-label">Continents Covered</span>
              <span className="coverage-value">7</span>
            </div>
            <div className="coverage-item">
              <span className="coverage-label">Countries with Data</span>
              <span className="coverage-value">150+</span>
            </div>
            <div className="coverage-item">
              <span className="coverage-label">Real-time Sources</span>
              <span className="coverage-value">3</span>
            </div>
            <div className="coverage-item">
              <span className="coverage-label">Historical Range</span>
              <span className="coverage-value">2000-2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterCharts;