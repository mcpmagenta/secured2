import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
// import { gsap } from 'gsap';

// 3D Feature Component
const FeatureObject = ({ 
  title, 
  description,
  number,
  color = '#4dabf7',
  position = [0, 0, 0],
  isActive = false,
  onClick
}: { 
  title: string;
  description: string;
  number: string;
  color?: string;
  position?: [number, number, number];
  isActive?: boolean;
  onClick: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Animation references
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));
  const targetRotation = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));
  
  // Subtle continuous animation
  useFrame(() => {
    if (meshRef.current) {
      const time = Date.now() * 0.001; // Use Date.now() instead of state.clock
      meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
      meshRef.current.rotation.y = Math.sin(time * 0.2) * 0.05;
    }
    
    // Handle active state animations
    if (groupRef.current) {
      // Scale animation
      const targetScale = isActive ? 1.1 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      // Rotation animation
      if (isActive) {
        targetRotation.current.y += 0.05;
      }
      
      // Smooth rotation interpolation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotationRef.current.x, 0.1);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rotationRef.current.z, 0.1);
    }
  });
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={onClick}
    >
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        {/* Feature card base */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[2.5, 1.5, 0.1]} />
          <meshStandardMaterial 
            color="#0c1929" 
            metalness={0.7}
            roughness={0.2}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Number indicator */}
        <mesh position={[-1, 0.5, 0.06]}>
          <circleGeometry args={[0.25, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Number text */}
        <Text
          position={[-1, 0.5, 0.07]}
          fontSize={0.15}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          {number}
        </Text>
        
        {/* Title */}
        <Text
          position={[0.2, 0.5, 0.06]}
          fontSize={0.18}
          maxWidth={2}
          textAlign="left"
          color={color}
          anchorX="left"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          {title}
        </Text>
        
        {/* Description */}
        <Text
          position={[-0.9, 0, 0.06]}
          fontSize={0.12}
          maxWidth={2.2}
          textAlign="left"
          color="white"
          anchorX="left"
          anchorY="top"
          font="/fonts/inter-medium.woff"
        >
          {description}
        </Text>
        
        {/* Glowing border */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[2.52, 1.52, 0.01]} />
          <meshBasicMaterial 
            color={color} 
            transparent
            opacity={isActive ? 0.3 : 0.1}
          />
        </mesh>
      </Float>
    </group>
  );
};

// Scene with multiple features
const FeatureScene = ({ features, scrollProgress = 0 }: { 
  features: Array<{
    title: string;
    description: string;
    number: string;
    color?: string;
  }>,
  scrollProgress?: number;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Set up camera position
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 0, 5);
    }
  }, [camera]);
  
  // Handle scroll progress to animate features
  useEffect(() => {
    console.log('Scroll Progress:', scrollProgress); // Debug log
    
    // Directly use scroll progress to position features
    // This creates a more direct connection between scrolling and animation
    if (groupRef.current) {
      // Calculate which feature should be active based on scroll progress
      const newIndex = Math.min(
        features.length - 1,
        Math.floor(scrollProgress * features.length)
      );
      
      console.log('Active Index:', newIndex); // Debug log
      setActiveIndex(newIndex);
      
      // Calculate the exact position based on scroll progress
      const targetY = -(scrollProgress * (features.length - 1) * 4);
      
      // Apply the position immediately for direct response to scrolling
      groupRef.current.position.y = targetY;
      
      // Add some rotation based on scroll progress for visual interest
      groupRef.current.rotation.y = scrollProgress * Math.PI * 0.5;
    }
  }, [scrollProgress, features.length]);
  
  // Handle feature selection
  const handleFeatureClick = (index: number) => {
    setActiveIndex(index);
  };
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4dabf7" />
      <fog attach="fog" args={["#000000", 3.5, 15]} />
      
      {/* Floating particles background */}
      <Particles count={100} />
      
      <group ref={groupRef} position={[0, 0, 0]}>
        {features.map((feature, index) => (
          <FeatureObject
            key={index}
            title={feature.title}
            description={feature.description}
            number={feature.number}
            color={feature.color}
            position={[0, -index * 4, 0]} // Even more spacing between features
            isActive={activeIndex === index}
            onClick={() => handleFeatureClick(index)}
          />
        ))}
      </group>
      
      {/* Glowing orb that follows active feature */}
      <mesh 
        position={[2, -activeIndex * 4, -1]} // Adjusted to match new spacing
        scale={[1, 1, 1]}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial 
          color={features[activeIndex]?.color || "#4dabf7"} 
          emissive={features[activeIndex]?.color || "#4dabf7"}
          emissiveIntensity={1}
          transparent
          opacity={0.7}
        />
      </mesh>
    </>
  );
};

// Particles component for background effect
const Particles = ({ count = 100 }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    // Position particles randomly
    if (mesh.current) {
      for (let i = 0; i < count; i++) {
        dummy.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [count, dummy]);

  // Animate particles
  useFrame(() => {
    if (mesh.current) {
      for (let i = 0; i < count; i++) {
        mesh.current.getMatrixAt(i, dummy.matrix);
        dummy.position.y -= 0.01;
        if (dummy.position.y < -5) dummy.position.y = 5;
        dummy.rotation.x += 0.01;
        dummy.rotation.z += 0.01;
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.05, 0.05, 0.05]} />
      <meshStandardMaterial color="#4dabf7" transparent opacity={0.3} />
    </instancedMesh>
  );
};

// Wrapper component with Canvas
const Feature3D = ({ features, scrollProgress }: { 
  features: Array<{
    title: string;
    description: string;
    number: string;
    color?: string;
  }>,
  scrollProgress?: number;
}) => {
  return (
    <div className="w-full h-[800px] relative">
      {/* Scroll indicator */}
      <div className="absolute top-4 right-4 text-sm text-white bg-blue-900/70 p-2 rounded-md z-50 font-mono">
        Scroll Progress: {scrollProgress ? scrollProgress.toFixed(2) : '0'}
      </div>
      
      {/* Scroll instruction */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center z-50 animate-bounce">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <p className="text-sm font-medium">Scroll to explore features</p>
        </div>
      </div>
      
      <Canvas dpr={[1, 2]} shadows>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#000', 5, 15]} />
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} castShadow />
        
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
        <FeatureScene features={features} scrollProgress={scrollProgress} />
        
        {/* Disable controls for more predictable scroll behavior */}
      </Canvas>
    </div>
  );
};

export default Feature3D;
