import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { DisasterLocation } from '../types/disaster';

interface GlobeProps {
  disasters: DisasterLocation[];
  onDisasterClick: (disaster: DisasterLocation) => void;
}

function Earth({ disasters, onDisasterClick }: GlobeProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const [hoveredDisaster, setHoveredDisaster] = useState<string | null>(null);
  
  const earthTexture = useLoader(TextureLoader, '/earth-texture.jpg');
  const bumpTexture = useLoader(TextureLoader, '/earth-bump.jpg');
  
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  const disasterMarkers = useMemo(() => {
    return disasters.map((disaster) => {
      const phi = (90 - disaster.latitude) * (Math.PI / 180);
      const theta = (disaster.longitude + 180) * (Math.PI / 180);
      const radius = 2.05;
      
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      
      return {
        position: [x, y, z] as [number, number, number],
        disaster,
      };
    });
  }, [disasters]);

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
      low: 0.02,
      moderate: 0.03,
      high: 0.04,
      critical: 0.05,
    };
    return sizes[severity] || 0.03;
  };

  return (
    <group>
      <Sphere ref={globeRef} args={[2, 64, 64]}>
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          specularMap={earthTexture}
          specular={new THREE.Color('grey')}
          shininess={5}
        />
      </Sphere>
      
      {disasterMarkers.map((marker) => (
        <group key={marker.disaster.id} position={marker.position}>
          <mesh
            onPointerOver={() => setHoveredDisaster(marker.disaster.id)}
            onPointerOut={() => setHoveredDisaster(null)}
            onClick={() => onDisasterClick(marker.disaster)}
          >
            <sphereGeometry args={[getMarkerSize(marker.disaster.severity), 16, 16]} />
            <meshBasicMaterial
              color={getMarkerColor(marker.disaster.type)}
              emissive={getMarkerColor(marker.disaster.type)}
              emissiveIntensity={hoveredDisaster === marker.disaster.id ? 2 : 1}
            />
          </mesh>
          
          {hoveredDisaster === marker.disaster.id && (
            <Html distanceFactor={10}>
              <div className="disaster-tooltip">
                <p className="disaster-name">{marker.disaster.name}</p>
                <p className="disaster-type">{marker.disaster.type}</p>
              </div>
            </Html>
          )}
          
          <mesh>
            <ringGeometry args={[getMarkerSize(marker.disaster.severity) * 1.5, getMarkerSize(marker.disaster.severity) * 2, 32]} />
            <meshBasicMaterial
              color={getMarkerColor(marker.disaster.type)}
              opacity={0.3}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Globe({ disasters, onDisasterClick }: GlobeProps) {
  return (
    <div className="globe-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 3, 5]} intensity={1} />
        <directionalLight position={[-5, -3, -5]} intensity={0.3} />
        
        <Earth disasters={disasters} onDisasterClick={onDisasterClick} />
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          rotateSpeed={0.5}
          zoomSpeed={0.5}
        />
        
        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#000814" />
        </mesh>
      </Canvas>
    </div>
  );
}