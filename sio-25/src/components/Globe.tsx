import { useRef, useEffect } from 'react';
import Globe from 'globe.gl';
import type { DisasterLocation } from '../types/disaster';

interface GlobeProps {
  disasters: DisasterLocation[];
  onDisasterClick: (disaster: DisasterLocation) => void;
}

export default function GlobeComponent({ disasters, onDisasterClick }: GlobeProps) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);

  useEffect(() => {
    if (!globeEl.current) return;

    // Initialize globe
    const globe = Globe()(globeEl.current)
      .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('lightskyblue')
      .atmosphereAltitude(0.15)
      .width(window.innerWidth)
      .height(window.innerHeight - 250); // Account for header and footer

    // Set initial camera position
    globe.camera().position.z = 400;
    globe.camera().position.x = 0;
    globe.camera().position.y = 0;

    // Store instance
    globeInstance.current = globe;

    // Handle window resize
    const handleResize = () => {
      if (globeEl.current && globeInstance.current) {
        globeInstance.current.width(window.innerWidth);
        globeInstance.current.height(window.innerHeight - 250);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (globeInstance.current) {
        globeInstance.current._destructor();
      }
    };
  }, []);

  useEffect(() => {
    if (!globeInstance.current) return;

    // Transform disasters data for globe.gl
    const pointsData = disasters.map((disaster) => ({
      lat: disaster.latitude,
      lng: disaster.longitude,
      size: getSizeFromSeverity(disaster.severity),
      color: getColorFromType(disaster.type),
      name: disaster.name,
      type: disaster.type,
      disaster: disaster
    }));

    // Update globe with disaster points
    globeInstance.current
      .pointsData(pointsData)
      .pointAltitude((d: any) => d.size * 0.5)
      .pointRadius((d: any) => d.size)
      .pointColor((d: any) => d.color)
      .pointLabel((d: any) => `
        <div style="text-align: center; padding: 4px;">
          <div style="font-weight: bold;">${d.name}</div>
          <div style="font-size: 0.9em; color: #888;">${d.type}</div>
        </div>
      `)
      .onPointClick((point: any) => {
        if (point.disaster) {
          onDisasterClick(point.disaster);
        }
      })
      .pointsMerge(false);

    // Add rings around points for visual effect
    const ringsData = disasters.map((disaster) => ({
      lat: disaster.latitude,
      lng: disaster.longitude,
      maxR: getSizeFromSeverity(disaster.severity) * 3,
      propagationSpeed: 1,
      repeatPeriod: 2000,
      color: getColorFromType(disaster.type)
    }));

    globeInstance.current
      .ringsData(ringsData)
      .ringColor((d: any) => d.color)
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod('repeatPeriod');

  }, [disasters, onDisasterClick]);

  const getSizeFromSeverity = (severity: DisasterLocation['severity']) => {
    const sizes = {
      low: 0.3,
      moderate: 0.5,
      high: 0.7,
      critical: 1.0,
    };
    return sizes[severity] || 0.5;
  };

  const getColorFromType = (type: DisasterLocation['type']) => {
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

  return (
    <div 
      ref={globeEl} 
      className="globe-container"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        background: 'radial-gradient(circle at center, #0a0e27 0%, #000814 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    />
  );
}