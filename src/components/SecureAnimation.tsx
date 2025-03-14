"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Cylinder, Torus, SpotLight, Trail } from '@react-three/drei';
import * as THREE from 'three';

export default function SecureAnimation({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const lockBodyRef = useRef<THREE.Mesh>(null);
  const shackleRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);

  // Generate particles for the data visualization
  const particleCount = 150; // Increased for more visual density
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const layerIndex = i % 12; // Creates 12 layers of particles for more depth
      const heightAngle = (layerIndex - 6) * Math.PI / 12;
      const radius = 3.8 + Math.sin(angle * 4) * 0.8; // Slightly larger radius for better visibility
      
      // Create more varied colors with a blue theme
      const hue = 0.55 + Math.random() * 0.15; // Blue to cyan range
      const saturation = 0.8 + Math.random() * 0.2;
      const lightness = 0.6 + Math.random() * 0.3;
      
      return {
        position: new THREE.Vector3(
          Math.cos(angle) * Math.cos(heightAngle) * radius,
          Math.sin(heightAngle) * radius,
          Math.sin(angle) * Math.cos(heightAngle) * radius
        ),
        originalScale: 0.15 + Math.random() * 0.25, // More varied particle sizes
        speed: 0.4 + Math.random() * 0.7, // More varied speeds
        phase: Math.random() * Math.PI * 2,
        heightPhase: Math.random() * Math.PI * 2,
        baseRadius: radius,
        color: new THREE.Color().setHSL(hue, saturation, lightness),
        pulseFrequency: 0.5 + Math.random() * 2, // For individual particle pulsing
        trailLength: 3 + Math.random() * 5, // For varied trail lengths
        trailWidth: 0.5 + Math.random() * 1.5 // For varied trail widths
      };
    });
  }, []);

  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current || !lockBodyRef.current || !shackleRef.current) return;

    timeRef.current += delta;
    const time = timeRef.current;
    
    // Rotate the entire lock based on progress with more dynamic movement
    const wobble = Math.sin(time * 2) * 0.05 * (1 - progress); // Subtle wobble that reduces with progress
    const targetRotation = progress > 0.3 ? time * 0.4 + wobble : time * 0.2 + wobble;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation,
      0.1
    );
    
    // Add subtle tilt based on progress
    const tiltX = Math.sin(time * 0.5) * 0.1 * (1 - progress);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      tiltX,
      0.05
    );

    // Animate the shackle based on progress with a snap effect
    const targetShackleY = progress > 0.7 ? -0.5 : 0;
    const snapSpeed = progress > 0.7 && shackleRef.current.position.y > -0.3 ? 0.4 : 0.2;
    
    if (shackleRef.current.position.y !== targetShackleY) {
      shackleRef.current.position.y = THREE.MathUtils.lerp(
        shackleRef.current.position.y,
        targetShackleY,
        snapSpeed
      );
    }
    
    // Add subtle pulsing to the lock body when secure
    if (progress > 0.7 && lockBodyRef.current) {
      const pulseScale = 1 + Math.sin(time * 5) * 0.02;
      lockBodyRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }

    // Animate particles based on progress
    particles.forEach((particle, i) => {
      const currentPos = particle.position;
      const phase = particle.phase + time * particle.speed;
      
      if (progress > 0.7) {
        // Final stage: Lock the data with an intense swirling effect
        const lockAngle = time * 3 + i * (Math.PI * 2 / particleCount);
        const verticalProgress = Math.min(1, (progress - 0.7) * 3);
        const lockRadius = THREE.MathUtils.lerp(2, 0.4, verticalProgress);
        const heightOffset = Math.sin(lockAngle * 0.5) * 0.3 * (1 - verticalProgress);
        currentPos.x = Math.cos(lockAngle) * lockRadius;
        currentPos.z = Math.sin(lockAngle) * lockRadius;
        currentPos.y = THREE.MathUtils.lerp(heightOffset, -0.5, verticalProgress);
      } else if (progress > 0.3) {
        // Second stage: Form an energetic shield with wave patterns
        const angle = (i / particleCount) * Math.PI * 2;
        const waveTime = time * 4;
        const pulseScale = 1 + Math.sin(waveTime + angle * 2) * 0.15;
        const radius = (2.5 - progress * 1.2) * pulseScale;
        const verticalOffset = Math.sin(phase + waveTime) * 0.5;
        const spiralOffset = Math.sin(waveTime * 0.5 + angle * 3) * 0.3;
        currentPos.x = (Math.cos(angle) * radius) + (Math.cos(angle * 2) * spiralOffset);
        currentPos.z = (Math.sin(angle) * radius) + (Math.sin(angle * 2) * spiralOffset);
        currentPos.y = verticalOffset;
      } else {
        // Initial stage: Energetic orbital motion with complex patterns
        const angle = phase + i * (Math.PI * 2 / particleCount);
        const heightPhase = particle.heightPhase + time * 0.4;
        const wavePhase = time * 1.2 + i * 0.3;
        const baseRadius = (particle.baseRadius + Math.sin(wavePhase) * 0.8) * (1 - progress * 0.25);
        const heightScale = Math.cos(heightPhase) * (1 - progress * 0.15);
        const spiralFactor = Math.sin(wavePhase * 0.5) * 0.5;
        
        currentPos.x = Math.cos(angle) * Math.cos(heightPhase) * baseRadius + spiralFactor;
        currentPos.z = Math.sin(angle) * Math.cos(heightPhase) * baseRadius + spiralFactor;
        currentPos.y = Math.sin(heightPhase) * baseRadius * heightScale + Math.sin(wavePhase) * 0.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Lights */}
      <ambientLight intensity={1} />
      <SpotLight
        position={[5, 5, 5]}
        angle={0.7}
        penumbra={0.4}
        intensity={3}
        distance={20}
        decay={1.5}
        color="#ffffff"
      />
      <SpotLight
        position={[-5, -5, 5]}
        angle={0.7}
        penumbra={0.4}
        intensity={2.5}
        distance={20}
        decay={1.5}
        color="#0ea5e9"
      />
      <SpotLight
        position={[0, 5, -5]}
        angle={0.6}
        penumbra={0.5}
        intensity={2}
        distance={15}
        decay={1.5}
        color="#38bdf8"
      />
      <pointLight
        position={[0, 0, 5]}
        intensity={1.5}
        distance={12}
        decay={1.5}
        color="#60a5fa"
      />

      {/* Enhanced Particles with Trails */}
      <group ref={particlesRef}>
        {particles.map((particle, i) => {
          // Only show trails for a subset of particles based on progress
          const showTrail = i % 3 === 0 || progress > 0.5;
          const trailLength = particle.trailLength * (progress > 0.7 ? 2 : 1);
          
          return (
            <group key={i}>
              {showTrail ? (
                <Trail
                  width={particle.trailWidth}
                  length={trailLength}
                  color={particle.color}
                  attenuation={(t) => t * t}
                  local={false}
                >
                  <mesh position={particle.position}>
                    <sphereGeometry args={[particle.originalScale, 12, 12]} />
                    <meshStandardMaterial
                      color={particle.color}
                      emissive={particle.color}
                      emissiveIntensity={1 + progress * 0.5}
                      metalness={0.9}
                      roughness={0.1}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                </Trail>
              ) : (
                <mesh position={particle.position}>
                  <sphereGeometry args={[particle.originalScale, 12, 12]} />
                  <meshStandardMaterial
                    color={particle.color}
                    emissive={particle.color}
                    emissiveIntensity={0.8 + progress * 0.4}
                    metalness={0.9}
                    roughness={0.1}
                    transparent
                    opacity={0.9}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {/* Enhanced Lock body with energy field */}
      <group>
        <RoundedBox
          ref={lockBodyRef}
          args={[2, 2.5, 1]}
          radius={0.2}
          smoothness={4}
          position={[0, -0.5, 0]}
        >
          <meshStandardMaterial
            color="#1e293b"
            emissive={progress > 0.7 ? "#0ea5e9" : "#1e293b"}
            emissiveIntensity={progress > 0.7 ? 0.3 + Math.sin(timeRef.current * 5) * 0.1 : 0}
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={2}
          />
        </RoundedBox>
        
        {/* Energy field around lock when secure */}
        {progress > 0.7 && (
          <group position={[0, -0.5, 0]}>
            {/* Horizontal energy rings */}
            {[...Array(3)].map((_, i) => {
              const scale = 1.2 + i * 0.3;
              const pulseSpeed = 3 + i * 0.5;
              const pulsePhase = i * Math.PI / 3;
              return (
                <Torus 
                  key={`ring-${i}`}
                  args={[scale, 0.03, 16, 32]}
                  rotation={[Math.PI/2, 0, 0]}
                >
                  <meshBasicMaterial
                    color="#0ea5e9"
                    transparent
                    opacity={0.3 + Math.sin(timeRef.current * pulseSpeed + pulsePhase) * 0.2}
                    blending={THREE.AdditiveBlending}
                  />
                </Torus>
              );
            })}
          </group>
        )}
      </group>

      {/* Lock shackle */}
      <group ref={shackleRef}>
        <Torus
          args={[0.4, 0.15, 16, 32, Math.PI]}
          rotation={[0, 0, Math.PI]}
          position={[0, 0.5, 0]}
        >
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={2}
          />
        </Torus>
        <Cylinder
          args={[0.15, 0.15, 1, 16]}
          position={[0.4, 0, 0]}
        >
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={2}
          />
        </Cylinder>
        <Cylinder
          args={[0.15, 0.15, 1, 16]}
          position={[-0.4, 0, 0]}
        >
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={2}
          />
        </Cylinder>
      </group>

      {/* Enhanced lock glow effect */}
      {progress > 0.5 && (
        <group position={[0, -0.5, 0]}>
          <mesh scale={[3, 3.5, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              color="#0ea5e9"
              transparent
              opacity={0.2 + Math.sin(timeRef.current * 2) * 0.1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <pointLight
            position={[0, 0, 1]}
            distance={4}
            intensity={3}
            color="#0ea5e9"
          />
          <pointLight
            position={[0, 0, -1]}
            distance={4}
            intensity={2}
            color="#38bdf8"
          />
        </group>
      )}

      {/* S² Text */}
      <Text
        position={[0, -0.5, 0.51]}
        fontSize={1}
        color="#e2e8f0"
        font="/fonts/Inter-Bold.woff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.05}
      >
        S²
      </Text>
      
      {/* Text glow effects */}
      <group position={[0, -0.5, 0.5]}>
        <mesh scale={[1.4, 0.7, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh scale={[1.2, 0.6, 1]} position={[0, 0, 0.1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <pointLight
          color="#0ea5e9"
          intensity={0.5}
          distance={1}
          decay={2}
        />
      </group>

      {/* This section is now handled by the enhanced particles with trails above */}

      {/* Enhanced Glow effects */}
      <group>
        {/* Dynamic background glow */}
        <mesh rotation={[0, 0, 0]} scale={5} position={[0, 0, -1.5]}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial
            color={progress > 0.7 ? "#0ea5e9" : "#60a5fa"}
            transparent
            opacity={0.1 * progress + Math.sin(timeRef.current * 2) * 0.05 * progress}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Radial light beams for final secure state */}
        {progress > 0.7 && (
          <group position={[0, -0.5, 0]} rotation={[0, timeRef.current * 0.2, 0]}>
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const pulsePhase = i * Math.PI / 4;
              return (
                <mesh 
                  key={`beam-${i}`}
                  position={[Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5]}
                  rotation={[Math.PI/2, 0, angle]}
                  scale={[0.2, 4, 1]}
                >
                  <planeGeometry args={[1, 1]} />
                  <meshBasicMaterial
                    color="#0ea5e9"
                    transparent
                    opacity={0.2 + Math.sin(timeRef.current * 3 + pulsePhase) * 0.1}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              );
            })}
          </group>
        )}
        
        {/* Enhanced lock glow effect */}
        {progress > 0.8 && (
          <group position={[0, -0.5, 0]}>
            {/* Pulsing glow plane */}
            <mesh scale={2.5}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                color="#0ea5e9"
                transparent
                opacity={0.2 + Math.sin(timeRef.current * 4) * 0.1}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            
            {/* Outer glow ring */}
            <Torus
              args={[1.8, 0.05, 16, 32]}
              rotation={[Math.PI/2, 0, timeRef.current * 0.5]}
            >
              <meshBasicMaterial
                color="#0ea5e9"
                transparent
                opacity={0.3 + Math.sin(timeRef.current * 3) * 0.2}
                blending={THREE.AdditiveBlending}
              />
            </Torus>
            
            {/* Dynamic lights */}
            <pointLight
              color="#0ea5e9"
              intensity={5 + Math.sin(timeRef.current * 5) * 1}
              distance={6}
              decay={2}
            />
            <pointLight
              color="#ffffff"
              intensity={3}
              distance={4}
              decay={2}
            />
            <pointLight
              color="#0284c7"
              intensity={2 + Math.sin(timeRef.current * 3) * 0.5}
              distance={3}
              decay={2}
            />
          </group>
        )}
      </group>
    </group>
  );
}
