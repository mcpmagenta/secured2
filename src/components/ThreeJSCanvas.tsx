"use client";

import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Animation phases - these are just for reference, the actual animation is continuous
const PHASES = {
  INTRO: 'intro',
  SHRINK: 'shrink',
  SHRED: 'shred',
  SECURE: 'secure',
};

// Phase thresholds for animation timing
const PHASE_THRESHOLDS = {
  [PHASES.INTRO]: { start: 0, end: 0.2 },
  [PHASES.SHRINK]: { start: 0.2, end: 0.4 },
  [PHASES.SHRED]: { start: 0.4, end: 0.7 },
  [PHASES.SECURE]: { start: 0.7, end: 1.0 },
};

// Data journey component that handles the continuous animation
function DataJourneyScene({ progress }: { progress: number }): React.ReactElement {
  // Get Three.js state including the invalidate function for manual rendering
  const { invalidate } = useThree();
  const sceneRef = useRef<THREE.Group>(null);
  const dataRef = useRef<THREE.Mesh>(null);
  const fragmentsRef = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Group>(null);
  
  // Animation state
  const timeRef = useRef(0);
  const fragmentsData = useRef<Array<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: number;
    speed: number;
    color: THREE.Color;
  }>>([]);
  
  // Track animation progress for each phase
  const animationProgress = useRef({
    shrink: 0,
    shred: 0,
    secure: 0,
    overall: 0,
    currentPhase: PHASES.INTRO,
    transitionFactor: 0,
  });
  
  // Update animation progress based on scroll position
  const updateProgress = (progress: number) => {
    // Store the overall progress
    animationProgress.current.overall = progress;
    
    // Calculate progress for each phase with smooth transitions
    // SHRINK phase
    if (progress >= PHASE_THRESHOLDS[PHASES.SHRINK].start) {
      const phaseProgress = Math.min(
        (progress - PHASE_THRESHOLDS[PHASES.SHRINK].start) / 
        (PHASE_THRESHOLDS[PHASES.SHRINK].end - PHASE_THRESHOLDS[PHASES.SHRINK].start),
        1
      );
      animationProgress.current.shrink = phaseProgress;
      
      if (progress < PHASE_THRESHOLDS[PHASES.SHRED].start) {
        animationProgress.current.currentPhase = PHASES.SHRINK;
        animationProgress.current.transitionFactor = phaseProgress;
      }
    }
    
    // SHRED phase
    if (progress >= PHASE_THRESHOLDS[PHASES.SHRED].start) {
      const phaseProgress = Math.min(
        (progress - PHASE_THRESHOLDS[PHASES.SHRED].start) / 
        (PHASE_THRESHOLDS[PHASES.SHRED].end - PHASE_THRESHOLDS[PHASES.SHRED].start),
        1
      );
      animationProgress.current.shred = phaseProgress;
      
      if (progress < PHASE_THRESHOLDS[PHASES.SECURE].start) {
        animationProgress.current.currentPhase = PHASES.SHRED;
        animationProgress.current.transitionFactor = phaseProgress;
      }
    }
    
    // SECURE phase
    if (progress >= PHASE_THRESHOLDS[PHASES.SECURE].start) {
      const phaseProgress = Math.min(
        (progress - PHASE_THRESHOLDS[PHASES.SECURE].start) / 
        (PHASE_THRESHOLDS[PHASES.SECURE].end - PHASE_THRESHOLDS[PHASES.SECURE].start),
        1
      );
      animationProgress.current.secure = phaseProgress;
      animationProgress.current.currentPhase = PHASES.SECURE;
      animationProgress.current.transitionFactor = phaseProgress;
    }
  };
  
  // Store previous progress to calculate velocity for smoother transitions
  const prevProgress = useRef(0);
  
  // Create fragments on mount with cleanup
  useEffect(() => {
    if (!fragmentsRef.current) return;
    
    // Create fragments data
    fragmentsData.current = Array.from({ length: 50 }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ),
      scale: 0.1 + Math.random() * 0.15,
      speed: 0.5 + Math.random() * 1.5,
      color: new THREE.Color().setHSL(
        // Hue variation
        Math.random(),
        // High saturation for vibrant look
        0.7 + Math.random() * 0.3, 
        // Brightness variation
        0.5 + Math.random() * 0.3
      )
    }));
    
    // Cleanup function
    return () => {
      // Clear fragment data on unmount
      if (fragmentsData.current) {
        fragmentsData.current = [];
      }
    };
  }, []);
  
  // Update animation progress when scroll progress changes
  useEffect(() => {
    // Apply easing to the progress for smoother transitions
    const easedProgress = gsap.parseEase('power2.out')(progress);
    updateProgress(easedProgress);
    
    // Manually trigger a render when progress changes
    // This is needed because we're using frameloop="demand"
    invalidate();
  }, [progress, invalidate]);

  // Animation loop with improved error handling and cleanup detection
  useFrame((state, delta) => {
    try {
      // Skip animation if component is unmounting or refs are invalid
      if (!sceneRef.current || !dataRef.current || !fragmentsRef.current || !lockRef.current) return;
      
      // Track time for animations with safe delta clamping to prevent large jumps
      const safeDelta = Math.min(delta, 0.1); // Prevent extreme time jumps
      timeRef.current += safeDelta;
      const time = timeRef.current;
      
      // Get current animation state with safe destructuring
      const { shrink, currentPhase, overall } = animationProgress.current;
      
      // Gentle rotation of the entire scene
      sceneRef.current.rotation.y = time * 0.1;
    
      // PHASE 1: SHRINK - Always visible but transforms based on progress
      // Make main data cube visible with extended overlap for smoother transitions
      dataRef.current.visible = currentPhase === PHASES.INTRO || 
                              currentPhase === PHASES.SHRINK || 
                              (currentPhase === PHASES.SHRED && animationProgress.current.transitionFactor < 0.7);
      
      if (dataRef.current.visible) {
        // Apply shrinking effect
        const shrinkScale = 1 - (shrink * 0.7);
        dataRef.current.scale.set(shrinkScale, shrinkScale, shrinkScale);
        
        // Rotate the data cube for visual interest
        dataRef.current.rotation.x = time * 0.2;
        dataRef.current.rotation.y = time * 0.3;
      }
      
      // PHASE 2: SHRED - Fragments become visible and scatter
      // Make fragments visible during shred phase with overlap for transitions
      if (fragmentsRef.current) {
        fragmentsRef.current.visible = currentPhase === PHASES.SHRED || 
                                      currentPhase === PHASES.SECURE;
        
        // Update fragment positions
        if (fragmentsRef.current.visible && fragmentsRef.current.children.length > 0) {
          const shredProgress = animationProgress.current.shred;
          
          // Update each fragment
          fragmentsRef.current.children.forEach((fragment, index) => {
            if (index < fragmentsData.current.length) {
              const fragmentData = fragmentsData.current[index];
              
              // Apply fragment-specific transformations
              if (fragment instanceof THREE.Mesh) {
                // Scatter the fragments outward
                const scatterFactor = Math.min(shredProgress * 2, 1);
                const targetPos = fragmentData.position.clone().multiplyScalar(2 * scatterFactor);
                
                // Smooth position transition
                fragment.position.lerp(targetPos, 0.1);
                
                // Rotate fragments
                fragment.rotation.x += safeDelta * fragmentData.speed * 0.5;
                fragment.rotation.y += safeDelta * fragmentData.speed * 0.7;
                fragment.rotation.z += safeDelta * fragmentData.speed * 0.3;
                
                // Scale fragments based on phase
                const targetScale = fragmentData.scale * (1 - (0.5 * animationProgress.current.secure));
                fragment.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
                
                // Apply color transitions
                if (fragment.material instanceof THREE.MeshStandardMaterial) {
                  // Transition to secure color in the secure phase
                  if (currentPhase === PHASES.SECURE) {
                    const secureColor = new THREE.Color(0x0ea5e9); // Sky blue
                    fragment.material.color.lerp(secureColor, 0.05);
                    fragment.material.emissive.lerp(secureColor.multiplyScalar(0.2), 0.05);
                  }
                }
              }
            }
          });
        }
      }
      
      // PHASE 3: SECURE - Lock becomes visible and fragments converge
      // Make lock visible during secure phase
      if (lockRef.current) {
        lockRef.current.visible = currentPhase === PHASES.SECURE;
        
        if (lockRef.current.visible) {
          const secureProgress = animationProgress.current.secure;
          
          // Scale up the lock as we progress
          const lockScale = 0.3 + (secureProgress * 0.7);
          lockRef.current.scale.set(lockScale, lockScale, lockScale);
          
          // Rotate the lock for visual interest
          lockRef.current.rotation.y = time * 0.5;
          
          // Pulse effect for the lock
          const pulse = Math.sin(time * 5) * 0.05 * secureProgress;
          lockRef.current.scale.multiplyScalar(1 + pulse);
        }
      }
      
      // Store current progress for next frame
      prevProgress.current = overall;
      
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
  });
  
  return (
    <group ref={sceneRef}>
      {/* Main data cube */}
      <mesh ref={dataRef} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#38bdf8" 
          roughness={0.3} 
          metalness={0.7} 
          emissive="#0284c7"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Fragments for shredding effect */}
      <group ref={fragmentsRef}>
        {Array.from({ length: 50 }).map((_, index) => (
          <mesh key={`fragment-${index}`} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial 
              color="#38bdf8" 
              roughness={0.3} 
              metalness={0.7} 
              emissive="#0284c7"
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>
      
      {/* Lock for secure phase */}
      <group ref={lockRef} position={[0, 0, 0]}>
        {/* Lock body */}
        <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.3]} />
          <meshStandardMaterial 
            color="#0ea5e9" 
            roughness={0.2} 
            metalness={0.8} 
            emissive="#0284c7"
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Lock shackle */}
        <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
          <torusGeometry args={[0.3, 0.08, 16, 32, Math.PI]} />
          <meshStandardMaterial 
            color="#0ea5e9" 
            roughness={0.2} 
            metalness={0.8} 
            emissive="#0284c7"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

// ThreeJSCanvas component that wraps the Three.js scene
interface ThreeJSCanvasProps {
  progress: number;
  currentPhase: string;
  phaseColors: { [key: string]: string };
}

// Using named function to avoid 'Cannot redeclare exported variable default' error
function ThreeJSCanvasComponent({ progress, currentPhase }: ThreeJSCanvasProps): React.ReactElement {
  return (
    <Canvas
      shadows
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: true,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false
      }}
      dpr={[1, 2]}
      key={`canvas-${currentPhase}`}
      frameloop="demand"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Enhanced lighting for dramatic effect */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />
      <spotLight 
        position={[0, 5, 0]} 
        angle={0.3} 
        penumbra={0.8} 
        intensity={0.5} 
        color="#38bdf8" 
        castShadow 
      />
      
      {/* Data journey animation */}
      <DataJourneyScene progress={progress} />
      
      {/* Environment */}
      <Environment preset="city" />
    </Canvas>
  );
}

// Export the component as default
export default ThreeJSCanvasComponent;
