"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Trail } from '@react-three/drei';
import * as THREE from 'three';

export default function ShrinkAnimation({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const spheresRef = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    
    if (groupRef.current && spheresRef.current && cubeRef.current) {
      // Rotate the entire group
      groupRef.current.rotation.y = time * 0.2;
      
      // Animate the cube to grow as progress increases
      cubeRef.current.scale.setScalar(progress * 1.2);
      
      // Pulse effect for the cube
      const pulseScale = 1 + Math.sin(time * 3) * 0.05 * progress;
      cubeRef.current.scale.multiplyScalar(pulseScale);
      
      // Increase emissive intensity as progress increases
      if (cubeRef.current && cubeRef.current.material) {
        // Use type assertion to tell TypeScript this is a MeshStandardMaterial
        const material = cubeRef.current.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.5 + progress * 0.5;
      }
      
      // Animate spheres based on progress
      spheresRef.current.children.forEach((sphere, i) => {
        const phase = (i / spheresRef.current!.children.length) * Math.PI * 2;
        
        // Start with a larger radius and shrink as progress increases
        const radius = THREE.MathUtils.lerp(2, 0.5, progress);
        
        // Add some vertical movement
        const verticalOffset = Math.sin(phase * 2 + time * 2) * (1 - progress) * 0.3;
        
        // Calculate positions with some wobble
        sphere.position.x = Math.cos(phase + time * (1 + progress * 0.5)) * radius;
        sphere.position.y = verticalOffset;
        sphere.position.z = Math.sin(phase + time * (1 + progress * 0.5)) * radius;
        
        // Scale down as they get closer to the cube
        sphere.scale.setScalar(THREE.MathUtils.lerp(0.3, 0.1, progress));
        
        // Increase speed of rotation as progress increases
        sphere.rotation.x += delta * (0.5 + progress * 2);
        sphere.rotation.y += delta * (0.5 + progress * 2);
        
        // Update material properties
        const sphereMesh = sphere.children[0] as THREE.Mesh;
        if (sphereMesh && sphereMesh.material) {
          const sphereMaterial = sphereMesh.material as THREE.MeshStandardMaterial;
          // Increase emissive intensity as progress increases
          sphereMaterial.emissiveIntensity = 0.5 + progress * 0.5;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Data particles that will be compressed */}
      <group ref={spheresRef}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Trail
            key={i}
            width={1.5}
            length={5 * (1 - progress)} // Trail gets shorter as compression increases
            color={new THREE.Color(0.2, 0.5, 0.8)}
            attenuation={(t) => t * t}
          >
            <Sphere args={[0.2]}>
              <meshStandardMaterial 
                color="#4299e1"
                emissive="#1d4ed8"
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </Sphere>
          </Trail>
        ))}
      </group>
      
      {/* Compressed data cube */}
      <Box ref={cubeRef} args={[1, 1, 1]} scale={0}>
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#2563eb"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </Box>
      
      {/* Compression effect rings */}
      <group rotation={[Math.PI / 2, 0, 0]} scale={1 - progress * 0.5}>
        {[1.8, 1.4, 1.0].map((radius, i) => (
          <mesh key={i} rotation={[0, 0, Math.PI * 2 * (i / 3)]}>
            <ringGeometry args={[radius, radius + 0.05, 32]} />
            <meshStandardMaterial
              color="#93c5fd"
              emissive="#3b82f6"
              emissiveIntensity={0.3 + progress * 0.7}
              transparent
              opacity={0.7 - progress * 0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
