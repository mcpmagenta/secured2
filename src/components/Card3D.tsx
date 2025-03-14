import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

// 3D Card Component
const Card = ({ 
  title, 
  /* icon, */
  color = '#4dabf7', 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isHovered = false
}: { 
  title: string;
  icon: string;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isHovered?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  // Create a simple colored plane instead of using textures
  // This avoids issues with SVG/PNG compatibility
  
  // Animation for hover effect
  const groupRef = useRef<THREE.Group>(null);
  
  // Subtle animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.02;
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.02;
    }
    
    // Handle hover scale animation
    if (groupRef.current) {
      const targetScale = isHovered ? 1.1 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        {/* Card base */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1, 0.1]} />
          <meshStandardMaterial 
            color="#0c1929" 
            metalness={0.5}
            roughness={0.2}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Glowing edge */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[1.6, 1.1, 0.01]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        
        {/* Icon - simplified colored shape */}
        <mesh position={[0, 0.15, 0.06]}>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Title */}
        <Text
          position={[0, -0.3, 0.06]}
          fontSize={0.12}
          maxWidth={1.3}
          textAlign="center"
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-medium.woff"
        >
          {title}
        </Text>
      </Float>
    </group>
  );
};

// Scene with multiple cards
const CardScene = ({ cards }: { cards: Array<{
  title: string;
  icon: string;
  color?: string;
}> }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4dabf7" />
      
      <group>
        {cards.map((card, index) => {
          // Calculate position in a grid or circle
          const angle = (index / cards.length) * Math.PI * 2;
          const radius = 2.5;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          
          return (
            <React.Fragment key={index}>
              <Card
                title={card.title}
                icon={card.icon}
                color={card.color}
                position={[x, 0, z]}
                rotation={[0, -angle, 0]}
                isHovered={hoveredIndex === index}
              />
              
              {/* Invisible mesh for hover detection */}
              <mesh
                position={[x, 0, z]}
                rotation={[0, -angle, 0]}
                onPointerOver={() => setHoveredIndex(index)}
                onPointerOut={() => setHoveredIndex(null)}
                visible={false}
              >
                <boxGeometry args={[1.5, 1, 0.1]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </React.Fragment>
          );
        })}
      </group>
    </>
  );
};

// Wrapper component with Canvas
const Card3D = ({ cards }: { cards: Array<{
  title: string;
  icon: string;
  color?: string;
}> }) => {
  return (
    <div className="w-full h-[500px]">
      <Canvas
        camera={{ position: [0, 1.5, 5], fov: 50 }}
        shadows
        dpr={[1, 2]}
      >
        <CardScene cards={cards} />
      </Canvas>
    </div>
  );
};

export default Card3D;
