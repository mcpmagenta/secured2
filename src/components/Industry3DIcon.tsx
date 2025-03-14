import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Define the industry types and their corresponding 3D models
export type IndustryType = 'healthcare' | 'financial' | 'government' | 'enterprise' | 'legal' | 'education';

// Props for the Industry3DIcon component
interface Industry3DIconProps {
  industry: IndustryType;
  color: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// Component to render a 3D icon for each industry
export default function Industry3DIcon({ 
  industry, 
  color, 
  scale = 1, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0] 
}: Industry3DIconProps) {
  // Reference to the group for animations
  const groupRef = useRef<THREE.Group>(null);
  
  // Create the icon when the component mounts or when props change
  useEffect(() => {
    createIcon();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, color]);
  
  // Create a simple 3D icon based on the industry type
  const createIcon = () => {
    const group = groupRef.current;
    if (!group) return;
    
    // Clear any existing children
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    
    // Create metallic material similar to the padlock in DataProtectionJourney
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color).multiplyScalar(0.2),
      emissiveIntensity: 0.3,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.15,
      reflectivity: 1.0
    });
    
    switch (industry) {
      case 'healthcare':
        // Simple medical cross
        const verticalGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.1);
        const horizontalGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.1);
        
        const verticalMesh = new THREE.Mesh(verticalGeometry, material);
        const horizontalMesh = new THREE.Mesh(horizontalGeometry, material);
        
        group.add(verticalMesh);
        group.add(horizontalMesh);
        break;
        
      case 'financial':
        // Simple coin
        const coinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 32);
        const coin = new THREE.Mesh(coinGeometry, material);
        coin.rotation.x = Math.PI / 2; // Lay flat
        group.add(coin);
        
        // Simple dollar sign
        const dollarGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.05);
        const dollarMesh = new THREE.Mesh(dollarGeometry, material);
        dollarMesh.position.z = 0.07;
        group.add(dollarMesh);
        break;
        
      case 'government':
        // Simple capitol dome
        const domeGeometry = new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const baseGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.5);
        
        const domeMesh = new THREE.Mesh(domeGeometry, material);
        domeMesh.position.y = 0.1;
        
        const baseMesh = new THREE.Mesh(baseGeometry, material);
        baseMesh.position.y = -0.1;
        
        group.add(domeMesh);
        group.add(baseMesh);
        break;
        
      case 'enterprise':
        // Simple building
        const buildingGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.2);
        const buildingMesh = new THREE.Mesh(buildingGeometry, material);
        group.add(buildingMesh);
        break;
        
      case 'legal':
        // Simple scales of justice
        const poleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
        const crossbarGeometry = new THREE.BoxGeometry(0.6, 0.03, 0.03);
        const dishGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16);
        
        // Pole
        const poleMesh = new THREE.Mesh(poleGeometry, material);
        
        // Crossbar
        const crossbarMesh = new THREE.Mesh(crossbarGeometry, material);
        crossbarMesh.position.y = 0.3;
        
        // Dishes
        const leftDishMesh = new THREE.Mesh(dishGeometry, material);
        leftDishMesh.position.set(-0.28, 0.25, 0);
        
        const rightDishMesh = new THREE.Mesh(dishGeometry, material);
        rightDishMesh.position.set(0.28, 0.25, 0);
        
        group.add(poleMesh);
        group.add(crossbarMesh);
        group.add(leftDishMesh);
        group.add(rightDishMesh);
        break;
        
      case 'education':
        // Simple graduation cap without tassel
        const capGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.6);
        
        // Cap
        const capMesh = new THREE.Mesh(capGeometry, material);
        
        group.add(capMesh);
        break;
    }
  };
  
  // Animation effect - gentle floating and rotation
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Subtle floating animation
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;
    
    // Very subtle rotation
    groupRef.current.rotation.y += 0.002;
  });
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    />
  );
}