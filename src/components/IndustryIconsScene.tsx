import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import Industry3DIcon, { IndustryType } from './Industry3DIcon';

interface IndustryIconsSceneProps {
  industry: IndustryType;
  color: string;
}

// Component to set up the scene lighting with enhanced effects
function SceneLighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />
      
      {/* Key light - main illumination from top-right */}
      <directionalLight 
        position={[3, 5, 2]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Fill light - softer light from left side */}
      <directionalLight 
        position={[-4, 3, -2]} 
        intensity={0.7} 
        castShadow 
        color="#e1e9ff"
      />
      
      {/* Rim light - highlights edges from behind */}
      <directionalLight 
        position={[0, -2, -5]} 
        intensity={0.5} 
        color="#a3c8ff"
      />
      
      {/* Bottom fill light for dimension */}
      <pointLight
        position={[0, -3, 0]}
        intensity={0.3}
        distance={5}
        color="#6b93ff"
      />
      
      {/* Front accent light */}
      <pointLight
        position={[0, 0, 4]}
        intensity={0.6}
        distance={6}
        color="#ffffff"
      />
    </>
  );
}

// Component to render a single industry icon with its scene
const IndustryIconsScene = ({ industry, color }: IndustryIconsSceneProps) => {
  // Map industry types to their corresponding colors if not provided
  const getIndustryColor = (industry: IndustryType): string => {
    switch (industry) {
      case 'healthcare':
        return '#dc2626'; // red
      case 'financial':
        return '#eab308'; // yellow/gold
      case 'government':
        return '#e5e7eb'; // light gray/silver
      case 'enterprise':
        return '#6366f1'; // indigo
      case 'legal':
        return '#3b82f6'; // blue
      case 'education':
        return '#f59e0b'; // amber
      default:
        return '#3b82f6'; // default blue
    }
  };

  const actualColor = color || getIndustryColor(industry);

  // Adjust camera position based on industry type for optimal viewing
  const getCameraPosition = (): [number, number, number] => {
    switch (industry) {
      case 'healthcare':
        return [1.2, 1.0, 2.2] as [number, number, number]; // Angled view for medical cross
      case 'financial':
        return [1.5, 1.2, 2.0] as [number, number, number]; // Higher angle for coins
      case 'government':
        return [1.8, 1.0, 2.2] as [number, number, number]; // View from side angle for capitol
      case 'enterprise':
        return [2.0, 0.8, 2.0] as [number, number, number]; // Side view for skyscraper
      case 'legal':
        return [1.5, 1.2, 2.0] as [number, number, number]; // Angled view for scales
      case 'education':
        return [1.8, 1.0, 2.0] as [number, number, number]; // Angled view for graduation cap
      default:
        return [1.5, 1.0, 2.0] as [number, number, number];
    }
  };

  return (
    <div className="w-full h-48 relative">
      <Canvas shadows dpr={[1, 2]} className="bg-transparent">
        <PerspectiveCamera 
          makeDefault 
          position={getCameraPosition()} 
          fov={45} 
          near={0.1}
          far={100}
        />
        <SceneLighting />
        
        {/* Add a subtle platform/ground for the icon to cast shadows on */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.7, 0]} 
          receiveShadow
        >
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
        
        {/* No platform beneath the icon - removed for cleaner look */}
        
        {/* Render the 3D industry icon */}
        <Industry3DIcon 
          industry={industry} 
          color={actualColor}
          position={[0, 0, 0]}
          rotation={[0.1, Math.PI / 4, 0]}
          scale={1.5}
        />
        
        {/* Add subtle controls for mobile interaction */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          rotateSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={1.0}
        />
        
        {/* Add a subtle environment for reflections */}
        <Environment preset="night" />
        
        {/* Add a subtle fog effect for depth */}
        <fog attach="fog" args={['#080818', 3.5, 7]} />
      </Canvas>
    </div>
  );
}

export default IndustryIconsScene;