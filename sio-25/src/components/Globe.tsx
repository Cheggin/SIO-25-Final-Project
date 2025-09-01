import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';
import type { DisasterLocation } from '../types/disaster';

interface GlobeProps {
  disasters: DisasterLocation[];
  onDisasterClick: (disaster: DisasterLocation) => void;
}

interface PointData {
  lat: number;
  lng: number;
  size: number;
  color: string;
  disaster: DisasterLocation;
}

export default function GlobeComponent({ disasters, onDisasterClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ReturnType<typeof Globe> | null>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) {
      console.error('Container not found');
      return;
    }

    console.log('Initializing globe...', { width: currentContainer.clientWidth, height: currentContainer.clientHeight });

    try {
      // Clear any existing content
      currentContainer.innerHTML = '';

      // Initialize globe with Earth texture (same as basic Globe.gl example)
      const globe = Globe()
        .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
        .backgroundColor('#000814')
        .width(currentContainer.clientWidth || 800)
        .height(currentContainer.clientHeight || 600);

      console.log('Globe instance created:', globe);

      // Add globe to container
      globe(currentContainer);
      globeRef.current = globe;

      console.log('Globe mounted successfully');

      // Handle window resize
      const handleResize = () => {
        if (currentContainer && globeRef.current) {
          globeRef.current
            .width(currentContainer.clientWidth)
            .height(currentContainer.clientHeight);
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        console.log('Cleaning up globe...');
        window.removeEventListener('resize', handleResize);
        
        // Comprehensive cleanup
        if (globeRef.current) {
          try {
            // Pause animation to stop rendering loop
            if (typeof globeRef.current.pauseAnimation === 'function') {
              globeRef.current.pauseAnimation();
            }
            
            // Clear all data layers
            if (typeof globeRef.current.pointsData === 'function') {
              globeRef.current.pointsData([]);
            }
            
            // Use internal destructor if available
            const globeInstance = globeRef.current as unknown as { _destructor?: () => void };
            if (typeof globeInstance._destructor === 'function') {
              globeInstance._destructor();
            }
            
            // Clear the reference
            globeRef.current = null;
            console.log('Globe cleaned up successfully');
          } catch (error) {
            console.error('Error during globe cleanup:', error);
          }
        }
        
        // Clean up DOM elements
        if (currentContainer) {
          currentContainer.innerHTML = '';
        }
      };
    } catch (error) {
      console.error('Error initializing globe:', error);
      // Show error message in container
      currentContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; flex-direction: column; gap: 1rem;">
          <div style="font-size: 1.2rem;">Failed to initialize globe</div>
          <div style="font-size: 0.9rem; opacity: 0.7;">Check console for details</div>
        </div>
      `;
    }
  }, []);

  useEffect(() => {
    if (!globeRef.current || disasters.length === 0) {
      console.log('No globe or disasters:', { globe: !!globeRef.current, disasters: disasters.length });
      return;
    }

    try {
      console.log('Adding disaster data to globe:', disasters.length, 'disasters');

      // Convert disasters to globe.gl format
      const pointsData = disasters.map(disaster => ({
        lat: disaster.latitude,
        lng: disaster.longitude,
        size: getMarkerSize(disaster.severity),
        color: getMarkerColor(disaster.type),
        disaster: disaster
      }));

      // Configure points layer
      globeRef.current
        .pointsData(pointsData)
        .pointAltitude(0.01)
        .pointRadius('size')
        .pointColor('color')
        .pointLabel((d: PointData) => `
          <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
            <div style="font-weight: bold;">${d.disaster.name}</div>
            <div style="color: #ccc;">${d.disaster.type} - ${d.disaster.severity}</div>
          </div>
        `)
        .onPointClick((point: PointData) => {
          onDisasterClick(point.disaster);
        });

      console.log('Disaster points added successfully');

      // Auto-rotate
      try {
        if (globeRef.current.controls && typeof globeRef.current.controls === 'function') {
          const controls = globeRef.current.controls();
          if (controls) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            console.log('Auto-rotate enabled');
          }
        }
      } catch (error) {
        console.warn('Could not enable auto-rotate:', error);
      }

    } catch (error) {
      console.error('Error configuring globe data:', error);
    }
  }, [disasters, onDisasterClick]);

  const getMarkerColor = (type: DisasterLocation['type']) => {
    const colors = {
      wildfire: '#ff4444',
      flood: '#4444ff', 
      hurricane: '#8844ff',
      drought: '#ff8844',
      heatwave: '#ff6644',
      storm: '#6644ff',
      earthquake: '#884444',
      other: '#888888',
    };
    return colors[type] || '#888888';
  };

  const getMarkerSize = (severity: DisasterLocation['severity']) => {
    const sizes = {
      low: 0.3,
      moderate: 0.5,
      high: 0.7,
      critical: 1.0,
    };
    return sizes[severity] || 0.5;
  };

  return (
    <div 
      ref={containerRef}
      className="globe-container"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '400px'
      }}
    />
  );
}