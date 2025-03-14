"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Trail, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export default function ShredAnimation({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Group>(null);
  const explosionRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  
  // Generate random targets for the fragments
  const fragmentCount = 16; // Increased for more visual impact
  const fragmentTargets = useMemo(() => {
    return Array.from({ length: fragmentCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 2 + Math.random() * 2;
      
      return {
        position: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * radius,
          Math.sin(phi) * Math.sin(theta) * radius,
          Math.cos(phi) * radius
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        scale: 0.2 + Math.random() * 0.2,
        speed: 0.5 + Math.random() * 1.5,
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.8, 0.6)
      };
    });
  }, []);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    
    if (groupRef.current && fragmentsRef.current && explosionRef.current) {
      // Subtle rotation of the entire group
      groupRef.current.rotation.y = time * 0.1;
      
      // Animate fragments based on progress
      fragmentsRef.current.children.forEach((fragment, i) => {
        const target = fragmentTargets[i];
        
        // Start position (compact cube)
        const startX = 0;
        const startY = 0;
        const startZ = 0;
        
        // Calculate explosion force based on progress
        const explosionForce = progress * target.speed;
        
        // Interpolate position based on progress
        fragment.position.x = startX + target.position.x * explosionForce;
        fragment.position.y = startY + target.position.y * explosionForce;
        fragment.position.z = startZ + target.position.z * explosionForce;
        
        // Rotate fragments as they explode outward
        fragment.rotation.x += delta * (1 + progress * 3);
        fragment.rotation.y += delta * (1 + progress * 2);
        fragment.rotation.z += delta * (1 + progress * 2.5);
        
        // Scale fragments based on progress
        const scaleMultiplier = 1 - progress * 0.3; // Fragments get slightly smaller as they move outward
        fragment.scale.setScalar(target.scale * scaleMultiplier);
        
        // Update material properties
        if (fragment.children[0]) {
          const boxMesh = fragment.children[0] as THREE.Mesh;
          // Check if material exists and is accessible
          if (boxMesh && boxMesh.material) {
            const material = boxMesh.material as THREE.MeshStandardMaterial;
            // Increase emissive intensity as progress increases
            material.emissiveIntensity = 0.5 + progress * 0.5;
            
            // Adjust opacity for fade effect at high progress
            if (progress > 0.8) {
              material.opacity = 1 - ((progress - 0.8) * 5); // Fade out at the very end
            }
          }
        }
      });
      
      // Animate explosion particles
      explosionRef.current.children.forEach((particle, i) => {
        const angle = (i / explosionRef.current!.children.length) * Math.PI * 2;
        const radius = progress * 1.5;
        const pulseScale = 1 + Math.sin(time * 10 + i) * 0.2;
        
        // Particles expand outward in a sphere
        particle.position.x = Math.cos(angle + time * 2) * Math.sin(i) * radius * pulseScale;
        particle.position.y = Math.sin(i * 2) * radius * pulseScale;
        particle.position.z = Math.sin(angle + time * 2) * Math.sin(i) * radius * pulseScale;
        
        // Scale particles based on progress
        particle.scale.setScalar(0.05 + progress * 0.1 * pulseScale);
        
        // Only show explosion particles when progress is significant
        particle.visible = progress > 0.2;
        
        // Update material properties
        if (particle.children[0]) {
          const sphereMesh = particle.children[0] as THREE.Mesh;
          const particleMaterial = sphereMesh.material as THREE.MeshStandardMaterial;
          
          if (particleMaterial) {
            // Increase emissive intensity with progress
            particleMaterial.emissiveIntensity = 0.8 + progress * 0.7;
            
            // Adjust opacity based on progress
            particleMaterial.opacity = progress < 0.2 ? 0 : Math.min(1, progress * 2) * pulseScale;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Data fragments that explode outward */}
      <group ref={fragmentsRef}>
        {Array.from({ length: fragmentCount }).map((_, i) => {
          const target = fragmentTargets[i];
          return (
            <Trail
              key={i}
              width={2}
              length={5 * Math.min(1, progress * 1.5)} // Trail length increases with progress
              color={target.color}
              attenuation={(t) => t * t}
            >
              <group>
                <Box 
                  args={[target.scale, target.scale, target.scale]}
                  rotation={target.rotation}
                >
                  <meshStandardMaterial
                    color={target.color}
                    emissive={target.color}
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                    transparent
                    opacity={1}
                  />
                </Box>
              </group>
            </Trail>
          );
        })}
      </group>
      
      {/* Explosion particles */}
      <group ref={explosionRef}>
        {Array.from({ length: 30 }).map((_, i) => (
          <Sphere key={i} args={[0.1, 8, 8]} visible={false}>
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#3b82f6"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </Sphere>
        ))}
      </group>
      
      {/* Central explosion effect */}
      <Sphere args={[progress * 0.8, 16, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#1d4ed8"
          emissive="#3b82f6"
          emissiveIntensity={1}
          transparent
          opacity={0.3 * progress}
        />
      </Sphere>
    </group>
  );
}
