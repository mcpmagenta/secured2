"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface DataObjectProps {
  shrinkProgress: number;
  shredProgress: number;
  secureProgress: number;
}

export default function DataObject({ shrinkProgress, shredProgress, secureProgress }: DataObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    
    // Base position adjustments
    let targetY = 0;
    let targetScale = 1;
    let targetRotationSpeed = 0.5;

    if (shrinkProgress > 0) {
      // During shrink phase, move up and scale down
      targetY = 2 - shrinkProgress * 2;
      targetScale = 1 - shrinkProgress * 0.6;
      targetRotationSpeed = 0.5 + shrinkProgress;
    }
    
    if (shredProgress > 0) {
      // During shred phase, split and rotate faster
      targetY = 0;
      targetScale = 0.4;
      targetRotationSpeed = 1.5 + shredProgress;
    }
    
    if (secureProgress > 0) {
      // During secure phase, move down towards the lock
      targetY = -secureProgress * 2;
      targetScale = 0.4 - secureProgress * 0.2;
      targetRotationSpeed = 1 - secureProgress * 0.5;
    }

    // Apply transformations
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.1
    );
    
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1)
    );

    // Rotate based on progress
    groupRef.current.rotation.y += delta * targetRotationSpeed;

    // Add some floating motion
    groupRef.current.position.y += Math.sin(timeRef.current * 2) * 0.01;
  });

  return (
    <group ref={groupRef}>
      {/* Core data object */}
      <Box args={[1, 1, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#60a5fa"
          metalness={0.8}
          roughness={0.2}
          emissive="#3b82f6"
          emissiveIntensity={0.5}
        />
      </Box>

      {/* Orbital rings */}
      <Torus args={[1.2, 0.02, 16, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#93c5fd"
          metalness={0.9}
          roughness={0.1}
          emissive="#60a5fa"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </Torus>
      <Torus args={[1.2, 0.02, 16, 32]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial
          color="#93c5fd"
          metalness={0.9}
          roughness={0.1}
          emissive="#60a5fa"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </Torus>

      {/* Data particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 0.8;
        return (
          <Sphere
            key={i}
            args={[0.08, 16, 16]}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius * 0.5,
              Math.sin(angle) * radius
            ]}
          >
            <meshStandardMaterial
              color="#bfdbfe"
              metalness={0.9}
              roughness={0.1}
              emissive="#60a5fa"
              emissiveIntensity={0.8}
            />
          </Sphere>
        );
      })}
    </group>
  );
}
