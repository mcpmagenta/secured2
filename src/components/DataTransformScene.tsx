"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { MotionValue, useMotionValue, useTransform } from 'framer-motion';
import ShrinkAnimation from './ShrinkAnimation';
import ShredAnimation from './ShredAnimation';
import SecureAnimation from './SecureAnimation';



// Helper function to ensure we always have a MotionValue
function useScrollValue(value: number | MotionValue<number>): MotionValue<number> {
  // For number input, create a motion value
  const numberMotionValue = useMotionValue(0);
  
  // If it's already a motion value, return it directly
  if (typeof value !== 'number') {
    return value;
  }
  
  // Otherwise, set the number motion value and return it
  numberMotionValue.set(value);
  return numberMotionValue;
}

export default function DataTransformScene({ scrollProgress }: { scrollProgress: number | MotionValue<number> }) {
  const timeRef = useRef(0);
  // Always call hooks unconditionally
  const scrollValue = useScrollValue(scrollProgress);
  
  // Calculate progress for each phase of the animation with better spacing
  const shrinkProgress = useTransform(scrollValue, (value) => {
    // Phase 1: 0-35% of scroll - Shrink
    return MathUtils.clamp(value * 2.86, 0, 1); // 1/0.35 ≈ 2.86
  });
  
  const shredProgress = useTransform(scrollValue, (value) => {
    // Phase 2: 35-70% of scroll - Shred
    return MathUtils.clamp((value - 0.35) * 2.86, 0, 1); // 1/0.35 ≈ 2.86
  });
  
  const secureProgress = useTransform(scrollValue, (value) => {
    // Phase 3: 70-100% of scroll - Secure
    return MathUtils.clamp((value - 0.70) * 3.33, 0, 1); // 1/0.3 ≈ 3.33
  });
  
  // Track which phase we're in for conditional rendering
  const currentPhase = useTransform(scrollValue, (value) => {
    if (value < 0.35) return 'shrink';
    if (value < 0.70) return 'shred';
    return 'secure';
  });
  
  // Create local state for tracking values
  const currentShrinkProgress = useRef(0);
  const currentShredProgress = useRef(0);
  const currentSecureProgress = useRef(0);
  const currentPhaseValue = useRef('shrink');
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    // Update our local state with the latest values
    currentShrinkProgress.current = shrinkProgress.get();
    currentShredProgress.current = shredProgress.get();
    currentSecureProgress.current = secureProgress.get();
    currentPhaseValue.current = currentPhase.get();
  });

  return (
    <group>
      {/* Dynamic lighting based on current phase */}
      <ambientLight intensity={0.5} />
      <pointLight 
        position={[5, 5, 5]} 
        intensity={1.5}
        color={currentPhaseValue.current === 'secure' ? '#0ea5e9' : currentPhaseValue.current === 'shred' ? '#3b82f6' : '#60a5fa'} 
      />
      <pointLight 
        position={[-5, -5, -5]} 
        intensity={1}
        color={currentPhaseValue.current === 'secure' ? '#0284c7' : currentPhaseValue.current === 'shred' ? '#1d4ed8' : '#2563eb'} 
      />
      
      {/* Phase 1: Shrink Animation - Only show in shrink phase */}
      {currentPhaseValue.current === 'shrink' && (
        <ShrinkAnimation progress={currentShrinkProgress.current} />
      )}
      
      {/* Phase 2: Shred Animation - Only show in shred phase */}
      {currentPhaseValue.current === 'shred' && (
        <ShredAnimation progress={currentShredProgress.current} />
      )}
      
      {/* Phase 3: Secure Animation - Only show in secure phase */}
      {currentPhaseValue.current === 'secure' && (
        <SecureAnimation progress={currentSecureProgress.current} />
      )}
      
      {/* Transition effects between phases */}
      {currentPhaseValue.current === 'shred' && currentShredProgress.current < 0.3 && (
        <mesh scale={[5, 5, 5]} position={[0, 0, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.2 * (1 - currentShredProgress.current / 0.3)}
            wireframe
          />
        </mesh>
      )}
      
      {currentPhaseValue.current === 'secure' && currentSecureProgress.current < 0.3 && (
        <mesh scale={[5, 5, 5]} position={[0, 0, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial 
            color="#0ea5e9" 
            transparent 
            opacity={0.2 * (1 - currentSecureProgress.current / 0.3)}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}
