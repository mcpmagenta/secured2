"use client";

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Animation phases
const PHASES = {
  INTRO: -1,
  SHRINK: 0,
  SHRED: 1,
  SECURE: 2
};

// Data cube component
function DataCube({ phase }: { phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  
  // Generate fragments for shredding
  const fragments = useRef(Array.from({ length: 20 }, () => ({
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ),
    rotation: new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ),
    scale: 0.2 + Math.random() * 0.2,
    speed: 0.5 + Math.random() * 0.5,
    color: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.8, 0.6)
  })));
  
  // Animation state
  const [animationState, setAnimationState] = useState({
    shrink: 0,
    shred: 0,
    secure: 0
  });
  
  // Listen for animation phase changes
  useEffect(() => {
    const handlePhaseChange = (e: CustomEvent) => {
      const { phase: newPhase } = e.detail;
      
      // Reset all states
      const newState = { shrink: 0, shred: 0, secure: 0 };
      
      // Set the active phase
      if (newPhase === PHASES.SHRINK) newState.shrink = 1;
      else if (newPhase === PHASES.SHRED) newState.shred = 1;
      else if (newPhase === PHASES.SECURE) newState.secure = 1;
      
      setAnimationState(newState);
    };
    
    window.addEventListener('updateAnimationState', handlePhaseChange as EventListener);
    return () => {
      window.removeEventListener('updateAnimationState', handlePhaseChange as EventListener);
    };
  }, []);
  
  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    
    if (!meshRef.current || !groupRef.current || !fragmentsRef.current || !lockRef.current) return;
    
    // Continuous rotation
    groupRef.current.rotation.y = time * 0.2;
    
    // SHRINK PHASE
    if (phase === PHASES.SHRINK || animationState.shrink > 0) {
      // Pulse effect
      const pulse = Math.sin(time * 3) * 0.05 + 1;
      meshRef.current.scale.set(
        1 - animationState.shrink * 0.6 + pulse * 0.05,
        1 - animationState.shrink * 0.6 + pulse * 0.05,
        1 - animationState.shrink * 0.6 + pulse * 0.05
      );
      
      // Update material
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.emissiveIntensity = 0.2 + animationState.shrink * 0.8;
      }
      
      // Hide fragments and lock during shrink phase
      fragmentsRef.current.visible = false;
      lockRef.current.visible = false;
    }
    
    // SHRED PHASE
    if (phase === PHASES.SHRED || animationState.shred > 0) {
      // Hide main cube, show fragments
      meshRef.current.visible = false;
      fragmentsRef.current.visible = true;
      lockRef.current.visible = false;
      
      // Animate fragments
      fragmentsRef.current.children.forEach((fragment, i) => {
        if (fragment instanceof THREE.Mesh) {
          const data = fragments.current[i];
          
          // Rotation and movement
          fragment.rotation.x += delta * data.speed;
          fragment.rotation.y += delta * data.speed * 1.3;
          
          // Dispersion effect
          const dispersionFactor = animationState.shred * 2;
          fragment.position.x = data.position.x * dispersionFactor;
          fragment.position.y = data.position.y * dispersionFactor;
          fragment.position.z = data.position.z * dispersionFactor;
          
          // Update material
          if (fragment.material instanceof THREE.MeshStandardMaterial) {
            fragment.material.emissiveIntensity = 0.2 + animationState.shred * 0.8;
          }
        }
      });
    }
    
    // SECURE PHASE
    if (phase === PHASES.SECURE || animationState.secure > 0) {
      // Hide main cube and show lock
      meshRef.current.visible = false;
      fragmentsRef.current.visible = true;
      lockRef.current.visible = true;
      
      // Animate fragments converging to lock
      fragmentsRef.current.children.forEach((fragment, i) => {
        if (fragment instanceof THREE.Mesh) {
          const data = fragments.current[i];
          
          // Rotation and movement
          fragment.rotation.x += delta * data.speed * 0.5;
          fragment.rotation.y += delta * data.speed * 0.7;
          
          // Converging effect
          const angle = time * 2 + i * 0.3;
          const radius = 1.5 * (1 - animationState.secure * 0.7);
          fragment.position.x = Math.cos(angle) * radius * 0.8;
          fragment.position.y = (Math.sin(angle * 2) * 0.5 - 0.5) * radius;
          fragment.position.z = Math.sin(angle) * radius * 0.8;
          
          // Update material
          if (fragment.material instanceof THREE.MeshStandardMaterial) {
            fragment.material.emissiveIntensity = 0.2 + animationState.secure * 0.8;
            fragment.material.opacity = 1 - animationState.secure * 0.3;
          }
        }
      });
      
      // Animate lock
      const lockPulse = Math.sin(time * 5) * 0.05 + 1;
      lockRef.current.scale.set(
        lockPulse,
        lockPulse,
        lockPulse
      );
      
      // Rotate lock
      lockRef.current.rotation.y = time * 0.5;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Main data cube */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#0ea5e9" 
          emissive="#0ea5e9"
          emissiveIntensity={0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Fragments for shredding */}
      <group ref={fragmentsRef} visible={false}>
        {fragments.current.map((fragment, i) => (
          <mesh 
            key={i}
            position={[0, 0, 0]}
            rotation={fragment.rotation}
            castShadow
          >
            <boxGeometry args={[fragment.scale, fragment.scale, fragment.scale]} />
            <meshStandardMaterial 
              color={fragment.color}
              emissive={fragment.color}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
              transparent
              opacity={0.9}
            />
          </mesh>
        ))}
      </group>
      
      {/* Lock for secure phase */}
      <group ref={lockRef} position={[0, -0.5, 0]} visible={false}>
        {/* Lock body */}
        <mesh castShadow>
          <boxGeometry args={[1.2, 1.5, 0.6]} />
          <meshStandardMaterial 
            color="#1e293b"
            emissive="#0ea5e9"
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        {/* Lock shackle */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <torusGeometry args={[0.3, 0.1, 16, 32, Math.PI]} />
          <meshStandardMaterial 
            color="#e2e8f0"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        {/* Lock shackle legs */}
        <mesh position={[0.3, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
          <meshStandardMaterial 
            color="#e2e8f0"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[-0.3, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
          <meshStandardMaterial 
            color="#e2e8f0"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

// Scene component
function Scene() {
  const { camera } = useThree();
  const [phase, setPhase] = useState(PHASES.INTRO);
  
  // Listen for animation phase changes
  useEffect(() => {
    const handlePhaseChange = (e: CustomEvent) => {
      setPhase(e.detail.phase);
    };
    
    window.addEventListener('updateAnimationState', handlePhaseChange as EventListener);
    return () => {
      window.removeEventListener('updateAnimationState', handlePhaseChange as EventListener);
    };
  }, []);
  
  // Camera animations
  useEffect(() => {
    if (!camera) return;
    
    // Define camera positions for each phase
    const cameraPositions = {
      [PHASES.INTRO]: { x: 0, y: 0, z: 5 },
      [PHASES.SHRINK]: { x: 1, y: 0.5, z: 4 },
      [PHASES.SHRED]: { x: -1, y: 0, z: 4.5 },
      [PHASES.SECURE]: { x: 0, y: -0.5, z: 4 }
    };
    
    // Animate camera position
    gsap.to(camera.position, {
      x: cameraPositions[phase].x,
      y: cameraPositions[phase].y,
      z: cameraPositions[phase].z,
      duration: 1.5,
      ease: "power2.inOut"
    });
    
    // Always look at center
    camera.lookAt(0, 0, 0);
  }, [camera, phase]);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />
      
      {/* Data visualization */}
      <DataCube phase={phase} />
      
      {/* Environment */}
      <Environment preset="city" />
    </>
  );
}

// Main component
export default function QuantaMorphicScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
