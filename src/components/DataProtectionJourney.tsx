"use client";

import React, { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Register the GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

interface DataProtectionJourneyProps {
  scrollContainerId?: string;
}

// Define a type for the progress bar colors
interface ProgressBarColors {
  from: string;
  to: string;
  progress: number;
  stageName: string;
}

const DataProtectionJourney: React.FC<DataProtectionJourneyProps> = ({ 
  scrollContainerId = 'data-journey-section' 
}) => {
  // Track if we're on a mobile device for animation adjustments
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs for DOM elements and Three.js objects
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  // Refs for 3D objects
  const dataGroupRef = useRef<THREE.Group | null>(null);
  const dataParticlesRef = useRef<THREE.Mesh[]>([]);
  const shredGroupRef = useRef<THREE.Group | null>(null);
  const shredParticlesRef = useRef<THREE.Mesh[]>([]);
  const secureGroupRef = useRef<THREE.Group | null>(null);
  const lockShackleRef = useRef<THREE.Group | null>(null);
  
  // State for tracking current animation stage
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentStage, setCurrentStage] = useState<string>('initial');
  
  // State for scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Padlock position and rotation states - defined at component level for access across functions
  // For a realistic padlock, we'll use a combination of rotation and translation for a sliding effect
  // Initial state (0-40%): Fully open - shackle is raised and rotated
  // Middle state (40-80%): Gradually moving toward closed - shackle starts to lower and rotate back
  // Final state (80-100%): Fully closed and locked - shackle is flush with lock body
  
  // Rotation values for the shackle
  const shackleClosedRotation = { x: 0, y: 0, z: 0 }; // Closed position (both legs in)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shacklePartiallyOpenRotation = { x: -Math.PI / 3, y: 0, z: 0 }; // 60 degrees open
  const shackleFullyOpenRotation = { x: -Math.PI * 0.75, y: 0, z: 0 }; // 135° backward - very clearly open
  
  // Translation values for the sliding effect - real padlocks slide up when unlocking
  const shackleClosedPosition = { y: 0 }; // Flush with the lock body
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shacklePartiallyOpenPosition = { y: 0.12 }; // More upward movement
  const shackleFullyOpenPosition = { y: 0.2 }; // Significant upward movement when fully open
  
  // Brand colors for the padlock
  // Use a silver color for the lock body for more realism
  const lockBodyColor = 0xc0c0c0; // Silver color for realistic metal appearance
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shackleColor = 0xf5f5f5; // Bright silver for the shackle
  
  // Create and setup the timeline with ScrollTrigger
  const setupTimeline = useCallback((): gsap.core.Timeline | null => {
    if (!containerRef.current || !sceneRef.current) return null;
    
    // Kill any existing timelines
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    
    // Create new timeline that will be controlled by scroll
    // This timeline will go from 0 to 1 as the user scrolls through the section
    const tl = gsap.timeline({
      paused: true, // Start paused, will be controlled by ScrollTrigger
      smoothChildTiming: true, // Ensures smooth animation when scrubbing
      defaults: {
        ease: 'power2.inOut', // Default ease for all animations
        duration: 0.33 // Default duration for animations (scaled to timeline)
      }
    });
    
    timelineRef.current = tl;
    return tl;
  }, []);

  // Animation function to animate 3D objects
  const animateObjects = useCallback(() => {
    if (!timelineRef.current || !secureGroupRef.current || !dataGroupRef.current || !shredGroupRef.current) return;
    
    // Apply the timeline with ScrollTrigger
    const tl = timelineRef.current;
    
    // We're completely removing the container height calculation
    // The parent component will handle the container height
    // This component will only control the animation timeline
    
    // Create ScrollTrigger for the animation timeline with simplified configuration
    // Use a safer configuration to prevent DOM insertion errors
    // Initialize immediately without delay
    
    // Clear any existing ScrollTrigger instances for this trigger
    ScrollTrigger.getAll().forEach(st => {
      if (st.vars.trigger === `#${scrollContainerId}`) {
        st.kill();
      }
    });
    
    // Create a new ScrollTrigger with safer configuration
    ScrollTrigger.create({
      id: `dataJourney-${scrollContainerId}`, // Add a specific ID for easier cleanup
      trigger: `#${scrollContainerId}`,
      start: 'top top', // Start immediately at the top
      end: '+=150%', // Increase scroll distance for slower animation progression
      scrub: 3, // Increase scrub value for smoother, slower transitions
      pin: false, // Don't pin here to avoid conflicts
      anticipatePin: 1, // Improves performance
      markers: false, // Set to true for debugging
      onLeaveBack: (self) => {
        // Ensure animation is reset when scrolling back to the top
        if (self.progress < 0.1) {
          tl.progress(0);
        }
      },
      onUpdate: (self) => {
        // Update scroll progress for progress bar (0-100)
        setScrollProgress(Math.round(self.progress * 100));
        
        // Update current stage based on progress with adjusted boundaries
        // Shrink phase: 0-35%, Shred phase: 35-70%, Secure phase: 70-100%
        if (self.progress < 0.35) {
          setCurrentStage('shrink');
        } else if (self.progress < 0.70) {
          setCurrentStage('shred');
        } else {
          // Secure stage goes all the way to 100%
          setCurrentStage('secure');
        }
        
        // Make sure the animation is still running
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        // Update the timeline based on scroll progress
        // This is the key part - the timeline controls all animations
        tl.progress(self.progress);
      }
    });
    
    // ===== MASTER TIMELINE SETUP =====
    // This single timeline will control all animations based on scroll position
    
    // 1. Initial state setup - make all groups visible but control with visibility
    tl.set(dataGroupRef.current, { visible: true }, 0);
    tl.set(shredGroupRef.current, { visible: false }, 0); // Ensure shred particles are completely hidden until 40%
    tl.set(secureGroupRef.current, { visible: true }, 0); // Lock visible during Shrink stage
    
    // Set initial opacity for all child meshes in each group
    dataGroupRef.current?.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material) {
        gsap.set(child.material, { opacity: 1 });
      }
    });
    
    secureGroupRef.current?.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material) {
        gsap.set(child.material, { opacity: 0.2 });
      }
    });
    
    // Camera animations for more dynamic experience
    if (cameraRef.current) {
      // We don't need to set initial camera position here since it's already set in the camera setup
      // This removes the conflicting position that causes the jump
      
      // CAMERA ANIMATIONS FOR EACH STAGE using proxy objects to avoid read-only property issues
      // Initial camera position proxy
      const camera = cameraRef.current;
      if (camera) {
        const camPos1 = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        
        // Shrink stage (0-40%): Camera slightly farther out to show the entire data set compressing
        // Adjust camera movement based on device size
        tl.to(camPos1, {
          // Mobile devices need the camera pulled back further to see the entire scene
          z: isMobile ? 5.5 : 4.5, // Further back on mobile
          y: isMobile ? 0.3 : 0.2, // Slightly higher elevation on mobile for better visibility
          x: 0, // Perfectly centered for both
          duration: 0.6, // Extended duration
          ease: 'sine.inOut', // Gentler easing for smoother motion
          onUpdate: () => {
            if (cameraRef.current) {
              cameraRef.current.position.set(camPos1.x, camPos1.y, camPos1.z);
            }
          }
        }, 0.01); // Tiny delay to prevent jump at 0%
        
        // Shred stage (40-80%): Camera zooms in and orbits slightly to highlight the swirling fragments
        // Start from the end position of the previous animation
        const camPos2 = { 
          x: 0, 
          y: isMobile ? 0.3 : 0.2, 
          z: isMobile ? 5.5 : 4.5 
        };
        
        tl.to(camPos2, {
          // Less movement on mobile to keep the scene in view
          z: isMobile ? 5.0 : 4.0, // Stay further back on mobile
          y: isMobile ? 0.4 : 0.4, // Similar elevation for both
          x: isMobile ? -0.1 : -0.2, // Less orbit on mobile to keep centered
          duration: 0.8, // Extended duration
          ease: 'sine.inOut', // Gentler easing
          onUpdate: () => {
            if (cameraRef.current) {
              cameraRef.current.position.set(camPos2.x, camPos2.y, camPos2.z);
            }
          }
        }, 0.40); // Adjusted to match new stage boundary at 40%
        
        // Secure stage (80-100%): Camera pushes in to focus on the final lock closure
        // Start from the end position of the previous animation
        const camPos3 = { 
          x: isMobile ? -0.1 : -0.2, 
          y: isMobile ? 0.4 : 0.4, 
          z: isMobile ? 5.0 : 4.0 
        };
        
        tl.to(camPos3, {
          // Less dramatic zoom on mobile to keep the lock fully visible
          z: isMobile ? 4.2 : 3.2, // Stay further back on mobile
          y: isMobile ? 0.3 : 0.2, // Similar adjustment for both
          x: isMobile ? -0.05 : -0.1, // Less side view on mobile
          duration: 0.5, // Quicker movement for dramatic effect
          ease: 'power2.inOut', // More dynamic easing
          onUpdate: () => {
            if (cameraRef.current) {
              cameraRef.current.position.set(camPos3.x, camPos3.y, camPos3.z);
            }
          }
        }, 0.80); // Delayed to match new stage boundary at 80%
      }
    }
    
    const secureGroup = secureGroupRef.current;
    const dataGroup = dataGroupRef.current;
    const shredGroup = shredGroupRef.current;
    
    // ===== STAGE 1: SHRINK (0-40% of timeline) =====
    if (dataParticlesRef.current.length > 0) {
      dataParticlesRef.current.forEach((particle) => {
        const originalScale = particle.scale.clone();
        const originalPosition = particle.position.clone();
        
        // Store original values for potential reset
        particle.userData.originalScale = originalScale;
        particle.userData.originalPosition = originalPosition;
        
        // Shrink animation - happens during first part of timeline (0-0.3)
        // Fix: Use a proxy object for animation and update the scale in onUpdate
        const scaleProxy = { value: 1 };
        tl.to(scaleProxy, {
          value: 0.1,
          duration: 0.6, // Further extended duration for even slower animation
          ease: 'sine.inOut', // Gentler easing for smoother motion
          onUpdate: () => {
            particle.scale.set(
              originalScale.x * scaleProxy.value,
              originalScale.y * scaleProxy.value,
              originalScale.z * scaleProxy.value
            );
          }
        }, 0);
        
        // Move to center
        // Fix: Use a proxy object for animation and update the position in onUpdate
        const posProxy = { 
          x: originalPosition.x,
          y: originalPosition.y,
          z: originalPosition.z 
        };
        tl.to(posProxy, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.6, // Further extended duration
          ease: 'sine.inOut', // Gentler easing
          onUpdate: () => {
            particle.position.set(posProxy.x, posProxy.y, posProxy.z);
          }
        }, 0);
      });
    }
    
    // ===== TRANSITION: SHRINK TO SHRED (at 40% of timeline) =====
    if (dataGroup && shredGroup && secureGroup) {
      // Start fading out data group materials at 35% mark and complete by 40%
      dataGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material) {
          tl.to(child.material, { 
            opacity: 0, 
            duration: 0.3, // Extended duration for smoother transition
            ease: 'sine.inOut' // Gentler easing
          }, 0.38); // Start fade out at 38% to complete by 40%
        }
      });
      
      // Hide data group after fade out completes
      tl.set(dataGroup, { visible: false }, 0.40);
      
      // Make shred group visible at 40% mark
      tl.set(shredGroup, { visible: true }, 0.40);
      
      // Set initial opacity for shred group materials
      shredGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material) {
          // Set initial opacity to 0
          tl.set(child.material, { opacity: 0 }, 0.40);
          // Then fade in
          tl.to(child.material, { 
            opacity: 1, 
            duration: 0.3, // Extended duration for smoother transition
            ease: 'sine.inOut' // Gentler easing
          }, 0.40); // Delayed timing to 40%
        }
      });
      
      // STAGE 1: SHRINK (0-40%)
      // Padlock is present but fully unlocked from the beginning
      if (lockShackleRef.current) {
        // Set the initial state - shackle is fully open
        tl.set(lockShackleRef.current.rotation, { x: shackleFullyOpenRotation.x }, 0);
        tl.set(lockShackleRef.current.position, { y: shackleFullyOpenPosition.y }, 0);
        
        // During the shrink phase, the shackle remains fully open
        // No animation needed here as we maintain the open state throughout this phase
      }
      
      // Adjust lock visibility throughout the journey by animating child materials
      // During shrink phase (0-40%), lock is visible but not dominant
      secureGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material) {
          // Set initial opacity during shrink phase
          tl.set(child.material, { opacity: 0.6 }, 0);
          
          // During shred phase (40-80%), make lock more visible
          tl.to(child.material, {
            opacity: 0.8, // More visible as it becomes the focus
            duration: 0.3
          }, 0.40);
          
          // During secure phase (80-100%), make lock fully visible and prominent
          tl.to(child.material, {
            opacity: 1.0, // Fully visible as the main focus
            duration: 0.3
          }, 0.80);
        }
      });
    }
    
    // ===== STAGE 2: SHRED (40-80% of timeline) =====
    if (shredParticlesRef.current.length > 0) {
      shredParticlesRef.current.forEach((particle, i) => {
        const randomX = (Math.random() - 0.5) * 6; // Wider explosion
        const randomY = (Math.random() - 0.5) * 6; // Wider explosion
        const randomZ = (Math.random() - 0.5) * 6; // Wider explosion
        const delay = i / shredParticlesRef.current.length * 0.1; // Slight stagger for more natural effect
        
        // Store initial position for potential reset
        particle.userData.initialPosition = particle.position.clone();
        
        // Explode particles outward - happens during middle of timeline (0.40-0.80)
        tl.to(particle.position, {
          x: randomX,
          y: randomY,
          z: randomZ,
          duration: 0.5, // Longer duration for more dramatic explosion
          ease: 'power4.out', // Sharper easing for more explosive effect
          delay: delay // Staggered delay
        }, 0.40); // Start at 40%
        
        // Rotate particles more dramatically using a proxy object
        const rotationValues = {
          x: particle.rotation.x,
          y: particle.rotation.y,
          z: particle.rotation.z,
          targetX: Math.random() * Math.PI * 4, // Store target values
          targetY: Math.random() * Math.PI * 4,
          targetZ: Math.random() * Math.PI * 4
        };
        
        tl.to(rotationValues, {
          x: rotationValues.targetX, // More rotation
          y: rotationValues.targetY, // More rotation
          z: rotationValues.targetZ, // More rotation
          duration: 0.5, // Match position animation
          ease: 'power2.inOut',
          delay: delay, // Staggered delay
          onUpdate: () => {
            particle.rotation.set(rotationValues.x, rotationValues.y, rotationValues.z);
          }
        }, 0.40); // Start at 40%
      });
    }
    
    // ===== TRANSITION: SHRED TO SECURE (80-100% of timeline) =====
    if (shredGroup && secureGroup && shredParticlesRef.current.length > 0 && lockShackleRef.current) {
      // Adjust convergence to match new timeline
      const convergeStart = 0.80; // Start convergence at 80%
      const convergeEnd = 0.90; // End after the lock fully closes
      
      // Create a more dramatic spiral path for particles to follow
      const createSpiralPath = (i: number, totalParticles: number) => {
        // Calculate angle based on particle index
        const angle = (i / totalParticles) * Math.PI * 12; // More rotations
        const radiusStart = 3.5; // Wider starting radius
        const radiusEnd = 0.05; // Tighter end radius (closer to lock)
        
        // Create points along a 3D spiral path
        const points = [];
        const steps = 15; // More steps for smoother path
        
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const radius = radiusStart * (1 - t) + radiusEnd * t;
          const spiralAngle = angle + t * Math.PI * 6; // More rotations
          
          // Spiral coordinates with more dynamic movement
          const x = Math.cos(spiralAngle) * radius;
          const z = Math.sin(spiralAngle) * radius;
          // More pronounced y-axis movement - particles rise then fall into lock
          const y = 0.3 * Math.sin(t * Math.PI) + (1 - t) * (Math.random() - 0.5) * 0.2;
          
          points.push(new THREE.Vector3(x, y, z));
        }
        
        return points;
      };
      
      // Total duration for convergence animation
      const convergeDuration = 0.18; // Even longer duration for more dramatic effect
      
      // Create staggered delays for particles
      shredParticlesRef.current.forEach((particle, i) => {
        // More pronounced staggering for visual interest
        const staggerIndex = i % 8; // Group particles into 8 waves for more variety
        const delay = staggerIndex * 0.015 + (i * 0.0015); // More pronounced staggering
        const startTime = convergeStart + (delay * (convergeEnd - convergeStart));
        
        // Generate spiral path for this particle
        const spiralPath = createSpiralPath(i, shredParticlesRef.current.length);
        
        // Create a motion path animation along the spiral
        const motionPath = {
          path: spiralPath,
          curviness: 1.5, // More pronounced curves
          type: "cubic", // Smooth cubic interpolation
          autoRotate: true, // Particle rotates to follow path
          alignOrigin: [0.5, 0.5, 0.5] // Center alignment
        };
        
        // Create a proxy object for the particle position
        const positionProxy = {
          x: particle.position.x,
          y: particle.position.y,
          z: particle.position.z
        };
        
        // Create a proxy object for the particle rotation
        const rotationProxy = {
          x: particle.rotation.x,
          y: particle.rotation.y,
          z: particle.rotation.z
        };
        
        // Animate along spiral path with more dynamic easing using proxies
        tl.to(positionProxy, {
          motionPath: motionPath,
          duration: convergeDuration,
          ease: "power3.in", // Sharper acceleration toward the end
          onUpdate: () => {
            // Update position
            particle.position.set(positionProxy.x, positionProxy.y, positionProxy.z);
            
            // If autoRotate is enabled, we need to manually update rotation
            // based on the motion path direction
            if (motionPath.autoRotate) {
              particle.rotation.set(rotationProxy.x, rotationProxy.y, rotationProxy.z);
            }
          }
        }, startTime);
        
        // Scale particles down as they converge using proxy object
        const scaleProxy = { value: 1 };
        const originalScale = particle.scale.clone();
        
        tl.to(scaleProxy, {
          value: 0.02, // Scale down to 2% of original size
          duration: convergeDuration,
          ease: 'power3.in', // Match the motion path easing
          onUpdate: () => {
            // Update scale using the proxy value
            particle.scale.set(
              originalScale.x * scaleProxy.value,
              originalScale.y * scaleProxy.value,
              originalScale.z * scaleProxy.value
            );
          }
        }, startTime);
        
        // Add a subtle glow effect to particles as they converge
        if (particle.material instanceof THREE.MeshStandardMaterial || 
            particle.material instanceof THREE.MeshPhysicalMaterial) {
          tl.to(particle.material, {
            emissiveIntensity: 2.0, // Increase glow as they converge
            duration: convergeDuration * 0.5, // Half the duration
            ease: 'power2.in'
          }, startTime);
        }
        
        // Increase speed of rotation as they converge using a proxy object
        const rotationValues = {
          x: particle.rotation.x,
          y: particle.rotation.y,
          z: particle.rotation.z
        };
        
        tl.to(rotationValues, {
          x: rotationValues.x + Math.PI * 6, // More rotations
          y: rotationValues.y + Math.PI * 6,
          z: rotationValues.z + Math.PI * 6,
          duration: convergeDuration,
          ease: 'power2.in',
          onUpdate: () => {
            particle.rotation.set(rotationValues.x, rotationValues.y, rotationValues.z);
          }
        }, startTime);
      });
      
      // Removed glow effect when particles converge into the lock
      // const glowGeometry = new THREE.SphereGeometry(0.4, 24, 24); // Slightly larger, smoother glow
      // const glowMaterial = new THREE.MeshBasicMaterial({
      //   color: 0x10b981, // Green color matching the secure stage
      //   transparent: true,
      //   opacity: 0
      // });
      // const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      // glow.position.y = 0.5; // Position at lock shackle
      // secureGroup.add(glow);
      
      // Removed large spark/flash effect that was creating the white circle
      // const sparkGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      // const sparkMaterial = new THREE.MeshBasicMaterial({
      //   color: 0xffffff,
      //   transparent: true,
      //   opacity: 0
      // });
      // const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
      // spark.position.set(0, 0.5, 0); // Position at lock shackle
      // secureGroup.add(spark);
      
      // STAGE 2: SHRED (40-80%)
      // During the shred phase, the shackle gradually starts to move toward closed position
      // Removed intermediate animations to keep lock fully open until secure stage
      // Lock will remain in fully open position until the secure stage at 70%
      
      // STAGE 3: SECURE (70-100%)
      // Direct animation from fully open to fully closed in one motion at the secure stage
      // Add null check for lockShackleRef.current
      if (lockShackleRef.current) {
        const shackleRotation = {
          x: shackleFullyOpenRotation.x // Start from fully open position
        };
        
        tl.to(shackleRotation, {
          x: shackleClosedRotation.x, // Animate directly to fully closed rotation
          duration: 0.5, // Quick, dramatic closing motion
          ease: 'back.out(1.5)', // Bounce effect for emphasis
          overwrite: 'auto', // Ensure this overrides any previous animations
          onUpdate: () => {
            if (lockShackleRef.current) {
              lockShackleRef.current.rotation.x = shackleRotation.x;
            }
          }
        }, 0.70); // Start at 70% of the timeline (beginning of secure stage)
      }
      
      // Direct animation from fully open to fully closed position
      if (lockShackleRef.current) {
        tl.to(lockShackleRef.current.position, {
          y: shackleClosedPosition.y, // Animate directly to fully closed position
          duration: 0.5, // Match rotation duration
          ease: 'back.out(1.5)', // Match rotation easing with bounce
          overwrite: 'auto' // Ensure this overrides any previous animations
        }, 0.70); // Same timing as rotation
      }
      
      // Add a more pronounced bounce at the moment the lock closes
      // Use a proxy object for scale animation to avoid read-only property error
      const shackleScaleProxy = { x: 1, y: 1, z: 1 };
      
      tl.to(shackleScaleProxy, {
        x: 1.25, y: 1.25, z: 1.25, // More pronounced scale for dramatic effect
        duration: 0.1, // Very short duration for a quick bounce
        ease: 'power2.in', // Sharper easing in
        onUpdate: () => {
          if (lockShackleRef.current) {
            lockShackleRef.current.scale.set(
              shackleScaleProxy.x,
              shackleScaleProxy.y,
              shackleScaleProxy.z
            );
          }
        }
      }, 0.75); // Moved earlier to match lock closing at 70%
      
      tl.to(shackleScaleProxy, {
        x: 1, y: 1, z: 1,
        duration: 0.3, // Longer duration for more noticeable bounce
        ease: 'elastic.out(1.5, 0.3)', // More elastic bounce on the return
        onUpdate: () => {
          if (lockShackleRef.current) {
            lockShackleRef.current.scale.set(
              shackleScaleProxy.x,
              shackleScaleProxy.y,
              shackleScaleProxy.z
            );
          }
        }
      }, 0.76); // Slightly after the bounce starts
      
      // Add a spark effect at the moment of locking
      // First find the lock in the secure group
      const lock = secureGroup?.children.find(child => 
        child instanceof THREE.Group
      ) as THREE.Group;
      
      // Then find the lock body in the lock group
      const lockBody = lock?.children.find(child => 
        child instanceof THREE.Group || 
        (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry)
      ) as THREE.Group | THREE.Mesh;
      
      // Then find the spark in the lock body
      const sparkMesh = lockBody?.children?.find(child => 
        child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.SphereGeometry
      ) as THREE.Mesh;
      
      if (sparkMesh && sparkMesh.material instanceof THREE.Material) {
        // Create proxy objects for scale animations - using much smaller values
        const sparkScaleProxy1 = { value: 0.5 }; // Start smaller
        const sparkScaleProxy2 = { value: 0.8 }; // Grow less
        
        // First animation - grow and show, but with much lower opacity
        tl.set(sparkMesh.material, { opacity: 0 }, 0.75);
        tl.to(sparkMesh.material, {
          opacity: 0.6, // Reduced opacity to make it less noticeable
          duration: 0.05, // Very quick flash
          ease: 'power4.out' // Sharp easing for a bright flash
        }, 0.75); // Moved earlier to match lock closing at 70%
        
        tl.to(sparkScaleProxy1, {
          value: 0.8, // Much smaller maximum scale
          duration: 0.05,
          ease: 'power4.out',
          onUpdate: () => {
            sparkMesh.scale.set(
              sparkScaleProxy1.value,
              sparkScaleProxy1.value,
              sparkScaleProxy1.value
            );
          }
        }, 0.75);
        
        // Second animation - shrink and fade
        tl.to(sparkMesh.material, {
          opacity: 0,
          duration: 0.1, // Faster fade out
          ease: 'power2.in'
        }, 0.76); // Fade out quickly
        
        tl.to(sparkScaleProxy2, {
          value: 0.2, // Shrink more
          duration: 0.1, // Faster shrink
          ease: 'power2.in',
          onUpdate: () => {
            sparkMesh.scale.set(
              sparkScaleProxy2.value,
              sparkScaleProxy2.value,
              sparkScaleProxy2.value
            );
          }
        }, 0.76);
      }
      
      // Add glow effect after lock is secured
      // Find lockGlow in the secureGroup
      const lockGlowMesh = secureGroup?.children.find(child => 
        child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.SphereGeometry && 
        child.geometry.parameters.radius === 1.2
      ) as THREE.Mesh;
      
      // Set a fixed opacity for the lock glow instead of animating it
      if (lockGlowMesh && lockGlowMesh.material instanceof THREE.Material) {
        lockGlowMesh.material.opacity = 0.3; // Fixed moderate opacity
      }
      
      // Enhance lock material when secure - start exactly when lock closes
      // Cast to Mesh to access material property
      if (lockShackleRef.current instanceof THREE.Mesh && 
          lockShackleRef.current.material instanceof THREE.Material) {
        tl.to(lockShackleRef.current.material, {
          emissiveIntensity: 1.2, // Reduced from 1.5 to 1.2 for a more balanced glow
          opacity: 1,
          duration: 0.2,
          overwrite: 'auto' // Ensure this overrides any previous animations
        }, 0.7); // Keep at 70% to coincide with lock closing
      }
      
      // We already have a spark effect at 0.85, so we'll remove this duplicate effect
      
      // Add a very subtle green glow to the lock shackle during transition to secure stage
      if (lockShackleRef.current && lockShackleRef.current instanceof THREE.Mesh && lockShackleRef.current.material) {
        // Set initial state
        tl.set(lockShackleRef.current.material, {
          emissive: new THREE.Color(0x10b981), // Green color matching the secure stage
          emissiveIntensity: 0.0 // Start with no glow
        }, 0.65); // Just before secure phase
        
        // Gradually increase the glow during transition
        tl.to(lockShackleRef.current.material, {
          emissiveIntensity: 0.6, // Subtle glow
          duration: 0.2,
          ease: 'sine.inOut'
        }, 0.65);
        
        // Then reduce it to a very subtle level
        tl.to(lockShackleRef.current.material, {
          emissiveIntensity: 0.3, // Maintain a very subtle glow
          duration: 0.3,
          ease: 'power1.out'
        }, 0.85);
      }
      
      // Make shredded data disappear more smoothly as it approaches the secure stage
      // Start fading out particles during the shred stage and complete by secure stage
      shredGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Start fading earlier in the timeline (around 50-60% mark)
          // This creates a smoother transition as we approach the secure stage
          const startTime = 0.5 + (Math.random() * 0.1);
          
          // Use a longer duration for a very gradual fade that completes as we reach secure
          tl.to(child.material, { 
            opacity: 0, 
            duration: 0.5, // Longer duration for an even more gradual fade
            ease: 'power1.inOut' // Smoother easing for natural disappearance
          }, startTime);
        }
      });
      
      // Then hide the group entirely once we're in the secure stage
      tl.set(shredGroup, { visible: false }, 0.82); // Just after all fades complete
      
      // Fade in secure group materials with staggered timing for a more gradual and natural transition
      secureGroup.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Calculate a staggered start time between 0.68 and 0.78
          const staggeredStart = 0.68 + (index % 5) * 0.02;
          
          tl.to(child.material, { 
            opacity: 1, 
            duration: 0.4, // Extended duration for smoother fade
            ease: 'power2.inOut' // More refined easing for a professional look
          }, staggeredStart);
        }
      });
      
      // Click effect is now handled above with the lock closing animation
    }
    
    // ===== STAGE 3: SECURE (80-95% of timeline) =====
    if (secureGroup) {
      // Initial rotation state - moved earlier to match lock closing at 70%
      tl.set(secureGroup.rotation, { y: 0 }, 0.7);
      
      // Very minimal rotation to maintain upright orientation
      // Just enough to add subtle 3D interest without flipping upside down
      // Use a proxy object for rotation animation
      const secureGroupRotation = {
        y: secureGroup.rotation.y
      };
      
      tl.to(secureGroupRotation, {
        y: Math.PI * 0.05, // Even more minimal rotation (about 9 degrees) to keep padlock upright
        duration: 0.15, // Shortened duration
        ease: 'sine.inOut', // Gentler easing
        onUpdate: () => {
          secureGroup.rotation.y = secureGroupRotation.y;
        }
      }, 0.75); // Moved earlier to happen after lock closes at 70%
      
      // Pulse the emission intensity for a "secure" effect
      const secureElements = secureGroup.children.filter((child): child is THREE.Mesh => 
        child instanceof THREE.Mesh && 
        child.material instanceof THREE.MeshStandardMaterial
      );
      
      secureElements.forEach((element) => {
        if (element instanceof THREE.Mesh && 
            element.material instanceof THREE.MeshStandardMaterial) {
          const material = element.material;
          // Set emissive intensity directly instead of storing unused variable
          material.emissiveIntensity = material.emissiveIntensity || 1.0;
          
          // Removed all GSAP animations that affect emissiveIntensity
          // The material will maintain its initial emissive intensity throughout
        }
      });
    }
  }, [
    scrollContainerId,
    shackleClosedPosition.y,
    shackleClosedRotation.x,
    shackleFullyOpenPosition.y,
    shackleFullyOpenRotation.x,
    // Removed unnecessary dependencies as per ESLint warning
    isMobile
  ]);
  
  // Setup the animation function
  const setupAnimation = useCallback(() => {
    // Clear any existing ScrollTrigger instances to prevent conflicts
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
    
    const tl = setupTimeline();
    if (tl) {
      // Set initial visibility - make all groups visible but control with opacity
      if (dataGroupRef.current) {
        dataGroupRef.current.visible = true;
        gsap.set(dataGroupRef.current, { opacity: 1 });
      }
      if (shredGroupRef.current) {
        shredGroupRef.current.visible = true; // Keep visible but transparent
        gsap.set(shredGroupRef.current, { opacity: 0 });
      }
      if (secureGroupRef.current) {
        secureGroupRef.current.visible = true; // Keep visible but transparent
        gsap.set(secureGroupRef.current, { opacity: 0 });
      }
      
      // Setup all animations
      animateObjects();
    }
    return tl;
  }, [setupTimeline, animateObjects]);
  
  // Initialize Three.js scene - combined into a single useLayoutEffect to avoid race conditions
  useLayoutEffect(() => {
    // Safety check - don't initialize if component is unmounting or not fully mounted
    if (!canvasRef.current || typeof window === 'undefined' || !containerRef.current) return;
    
    // Clear any previous instances first to prevent DOM errors
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Kill any existing GSAP animations safely
    if (dataGroupRef.current) gsap.killTweensOf(dataGroupRef.current);
    if (shredGroupRef.current) gsap.killTweensOf(shredGroupRef.current);
    if (secureGroupRef.current) gsap.killTweensOf(secureGroupRef.current);
    if (lockShackleRef.current) gsap.killTweensOf(lockShackleRef.current);
    
    // Kill any existing ScrollTrigger instances
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
    // This check is now at the beginning of the effect
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Set up camera with enhanced perspective
    const camera = new THREE.PerspectiveCamera(
      65, // Slightly wider FOV for more dramatic perspective
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    // Position camera to match exactly what we want at 0% scroll
    // These values must match the tl.set() values at position 0 in the timeline
    camera.position.z = 5;
    camera.position.y = 0;
    camera.position.x = 0; // Centered position for better visual balance
    camera.lookAt(0, 0, 0); // Look at center point
    cameraRef.current = camera;
    
    // Create renderer with settings to prevent disappearing
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // Prevents disappearing in some browsers
      powerPreference: 'high-performance'
    });
    
    // Set proper size - use container size instead of window size
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    // Force renderer to always render even when page is not in focus
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    
    rendererRef.current = renderer;
    
    // Enhanced lighting setup for more dramatic 3D appearance
    
    // Ambient light - slightly brighter for better base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 2.5);
    scene.add(ambientLight);
    
    // Main directional light - positioned for dramatic shadows and metallic highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(2, 3, 4);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Secondary directional light from opposite side for rim lighting on metal surfaces
    const metalRimLight = new THREE.DirectionalLight(0xccffee, 0.8);
    metalRimLight.position.set(-2, 1, -3);
    scene.add(metalRimLight);
    
    // Blue point light for brand alignment - increased intensity for better reflections
    const pointLight1 = new THREE.PointLight(0x0088ff, 3.5, 15);
    pointLight1.position.set(0, 1, 4);
    scene.add(pointLight1);
    
    // Secondary accent light - repositioned for better metallic highlights
    const pointLight2 = new THREE.PointLight(0x00ccff, 3.0, 12);
    pointLight2.position.set(-3, 2, 3);
    scene.add(pointLight2);
    
    // Add a brighter point light specifically for the padlock to enhance its silver metallic appearance
    const lockLight = new THREE.PointLight(0xffffff, 4.0, 8); // Increased intensity and range
    lockLight.position.set(1.5, 0.5, 2.5); // Repositioned for better edge highlighting
    if (secureGroupRef.current) {
      secureGroupRef.current.add(lockLight);
    }
    
    // Add a second light from a different angle to create more definition on the padlock
    const lockRimLight = new THREE.PointLight(0xeeeeff, 3.0, 6); // Increased intensity and range
    lockRimLight.position.set(-1.5, 1, 1.5); // Repositioned for better coverage
    if (secureGroupRef.current) {
      secureGroupRef.current.add(lockRimLight);
    }
    
    // Add a third light from below to highlight the bottom edge of the lock
    const lockBottomLight = new THREE.PointLight(0xffffee, 2.0, 5);
    lockBottomLight.position.set(0, -1.5, 1);
    if (secureGroupRef.current) {
      secureGroupRef.current.add(lockBottomLight);
    }
    
    // Add rim light for edge definition with slight blue tint for cool metallic look
    const rimLight = new THREE.PointLight(0xeeeeff, 2.5, 10);
    rimLight.position.set(0, -3, -5); // Behind objects
    scene.add(rimLight);
    
    // Orange accent light for the shred stage
    const orangeLight = new THREE.PointLight(0xff7700, 2, 10);
    orangeLight.position.set(3, -1, 2);
    scene.add(orangeLight);
    
    // Modified green accent light for the secure stage - reduced intensity and moved further away
    const greenLight = new THREE.PointLight(0x20ffb0, 0.8, 15); // Lighter color, much lower intensity, and greater distance
    greenLight.position.set(-5, -3, -5); // Positioned further away to reduce circular effect
    scene.add(greenLight);
    
    // Subtle fog for depth - reduced density for better visibility
    scene.fog = new THREE.FogExp2(0x000000, 0.03);
    
    // Animation loop with rotation for visual interest and safety checks
    const animate = () => {
      // Check if component is still mounted and all required refs exist
      if (!canvasRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
        // If essential components are missing, don't continue the animation loop
        return;
      }
      
      try {
        // Add rotation to data group - ensure it's always rotating for visibility
        if (dataGroupRef.current) {
          dataGroupRef.current.rotation.y += 0.002;
          dataGroupRef.current.rotation.x += 0.0005;
        }
        
        // Add rotation to shred group - only if it's visible
        if (shredGroupRef.current && shredGroupRef.current.visible) {
          shredGroupRef.current.rotation.y += 0.003;
          shredGroupRef.current.rotation.z += 0.0007;
        }
        
        // Add rotation to secure group
        if (secureGroupRef.current) {
          secureGroupRef.current.rotation.y += 0.001;
          secureGroupRef.current.rotation.z += 0.0003;
        }
        
        // Force render even if not visible in viewport
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        
        // Continue animation loop only if component is still mounted
        if (canvasRef.current) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      } catch (error) {
        console.error('Error in animation loop:', error);
        // Don't continue the loop if there was an error
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };
    
    // Make sure the animation loop is persistent
    const ensureAnimationIsRunning = () => {
      if (!animationFrameRef.current && canvasRef.current && sceneRef.current && cameraRef.current && rendererRef.current) {
        animate();
      }
    };
    
    // Force immediate rendering to ensure visibility without delays
    if (rendererRef.current && sceneRef.current && cameraRef.current && canvasRef.current) {
      try {
        // Render immediately with high priority
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        // Request an immediate animation frame for the next render
        requestAnimationFrame(() => {
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        });
        
        // Start animation loop only if component is still mounted
        if (canvasRef.current) {
          animate();
          
          // Set up an interval to ensure animation keeps running with minimal delay
          const animationCheckInterval = setInterval(ensureAnimationIsRunning, 200);
          
          // Clean up interval on component unmount
          return () => {
            clearInterval(animationCheckInterval);
          };
        }
      } catch (error) {
        console.error('Error during initial renders:', error);
      }
    }
    
    // Cleanup - Ensure proper cleanup of all resources
    return () => {
      // Use a try-catch block to prevent errors during cleanup
      try {
        // First cancel animation frame to stop rendering
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Kill all GSAP animations safely
        if (dataGroupRef.current) gsap.killTweensOf(dataGroupRef.current);
        if (shredGroupRef.current) gsap.killTweensOf(shredGroupRef.current);
        if (secureGroupRef.current) gsap.killTweensOf(secureGroupRef.current);
        if (lockShackleRef.current) gsap.killTweensOf(lockShackleRef.current);
        
        // Kill timeline
        if (timelineRef.current) {
          timelineRef.current.kill();
          timelineRef.current = null;
        }
        
        // Kill ScrollTrigger instances - be more specific to avoid conflicts
        if (typeof ScrollTrigger !== 'undefined') {
          // First kill any ScrollTrigger instances specifically tied to our container
          ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars.trigger === `#${scrollContainerId}`) {
              trigger.kill();
            }
          });
          
          // Then check for any orphaned ScrollTrigger instances created by this component
          const allTriggers = ScrollTrigger.getAll();
          if (allTriggers.length > 0) {
            console.log(`Cleaning up ${allTriggers.length} remaining ScrollTrigger instances`);
            allTriggers.forEach(trigger => {
              // Only kill triggers that might be related to this component
              // This is a safety measure to avoid killing triggers from other components
              if (trigger.vars.id?.includes('dataJourney') || !trigger.vars.id) {
                trigger.kill();
              }
            });
          }
        }
        
        // Dispose of Three.js resources
        if (sceneRef.current) {
          // Use a safer approach to clear scene children
          const children = [...sceneRef.current.children];
          children.forEach(child => {
            sceneRef.current?.remove(child);
          });
        
        // Dispose of materials and geometries
        sceneRef.current.traverse((object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      
        // Dispose of renderer safely
        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current.forceContextLoss();
          rendererRef.current.domElement = null as unknown as HTMLCanvasElement;
          rendererRef.current = null;
        }
        
        // Clear all refs
        dataGroupRef.current = null;
        shredGroupRef.current = null;
        secureGroupRef.current = null;
        lockShackleRef.current = null;
        dataParticlesRef.current = [];
        shredParticlesRef.current = [];
        sceneRef.current = null;
        cameraRef.current = null;
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [scrollContainerId]);
  
  // Create the 3D objects for the data protection journey
  useLayoutEffect(() => {
    // Skip if component is unmounting or scene doesn't exist
    if (!sceneRef.current || typeof window === 'undefined') return;
    
    // Clear any existing objects to prevent memory leaks
    if (dataGroupRef.current && sceneRef.current) {
      sceneRef.current.remove(dataGroupRef.current);
      dataGroupRef.current = null;
    }
    
    if (shredGroupRef.current && sceneRef.current) {
      sceneRef.current.remove(shredGroupRef.current);
      shredGroupRef.current = null;
    }
    
    if (secureGroupRef.current && sceneRef.current) {
      sceneRef.current.remove(secureGroupRef.current);
      secureGroupRef.current = null;
    }
    if (!sceneRef.current || typeof window === 'undefined') return;
    
    const scene = sceneRef.current;
    
    // 1. Create Data Group (initial state)
    const dataGroup = new THREE.Group();
    dataGroup.visible = true;
    dataGroup.position.x = 0; // Center in the right column
    scene.add(dataGroup);
    dataGroupRef.current = dataGroup;
    
    // Create data particles (representing raw data)
    const dataParticles: THREE.Mesh[] = [];
    const particleCount = 60; // Increased count for more visual density
    
    // Use a mix of geometries for more visual interest
    const geometries = [
      new THREE.BoxGeometry(0.25, 0.25, 0.25),
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.OctahedronGeometry(0.2)
    ];
    
    // Enhanced material with higher emission and reflectivity
    const particleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3498db,
      emissive: 0x0088ff,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      reflectivity: 1.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5
    } as THREE.MeshPhysicalMaterialParameters);
    
    for (let i = 0; i < particleCount; i++) {
      // Randomly select one of the geometries for variety
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const particle = new THREE.Mesh(geometry, particleMaterial.clone()); // Clone material for individual control
      
      // Random position within a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 1;
      
      particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
      particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
      particle.position.z = radius * Math.cos(phi);
      
      // Random rotation
      particle.rotation.x = Math.random() * Math.PI;
      particle.rotation.y = Math.random() * Math.PI;
      particle.rotation.z = Math.random() * Math.PI;
      
      dataGroup.add(particle);
      dataParticles.push(particle);
    }
    dataParticlesRef.current = dataParticles;
    
    // 2. Create Shred Group (intermediate state)
    const shredGroup = new THREE.Group();
    shredGroup.visible = false; // Initially invisible until 30% scroll
    shredGroup.position.x = 0; // Center in the right column
    // Use gsap to set opacity since Group doesn't have an opacity property
    gsap.set(shredGroup, { opacity: 0 });
    // Explicitly ensure it's hidden
    shredGroup.userData.hidden = true; // Custom flag to track hidden state
    scene.add(shredGroup);
    shredGroupRef.current = shredGroup;
    
    // Create shredded particles (representing data being broken down)
    const shredParticles: THREE.Mesh[] = [];
    const shredCount = 120; // Increased for more visual density
    
    // Use multiple geometries for more interesting shredded effect
    const shredGeometries = [
      new THREE.TetrahedronGeometry(0.12),
      new THREE.OctahedronGeometry(0.1, 0),
      new THREE.IcosahedronGeometry(0.08, 0)
    ];
    
    // Enhanced material with stronger emission and better light response
    const shredMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff9500,
      emissive: 0xff5500,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.7,
      reflectivity: 0.8,
      clearcoat: 0.3,
      transmission: 0.1, // Slight transparency
      transparent: true
    } as THREE.MeshPhysicalMaterialParameters);
    
    for (let i = 0; i < shredCount; i++) {
      // Randomly select one of the geometries for variety
      const geometry = shredGeometries[Math.floor(Math.random() * shredGeometries.length)];
      const particle = new THREE.Mesh(geometry, shredMaterial.clone());
      
      // Add slight color variation to each particle
      if (particle.material instanceof THREE.MeshPhysicalMaterial) {
        const hueShift = (Math.random() - 0.5) * 0.1;
        particle.material.color.offsetHSL(hueShift, 0, 0);
        particle.material.emissive.offsetHSL(hueShift, 0, 0);
      }
      
      // Cluster around center initially
      particle.position.x = (Math.random() - 0.5) * 0.5;
      particle.position.y = (Math.random() - 0.5) * 0.5;
      particle.position.z = (Math.random() - 0.5) * 0.5;
      
      // Random rotation
      particle.rotation.x = Math.random() * Math.PI;
      particle.rotation.y = Math.random() * Math.PI;
      particle.rotation.z = Math.random() * Math.PI;
      
      // Random scale for variety
      const scale = 0.5 + Math.random() * 1;
      particle.scale.set(scale, scale, scale);
      
      shredGroup.add(particle);
      shredParticles.push(particle);
    }
    shredParticlesRef.current = shredParticles;
    
    // 3. Create Secure Group (final state) with unlocked and locked states
    const secureGroup = new THREE.Group();
    secureGroup.visible = true;
    secureGroup.position.x = 0; // Center in the right column
    // Make it more visible from the start - the lock is present throughout the journey
    gsap.set(secureGroup, { opacity: 0.6 });
    scene.add(secureGroup);
    secureGroupRef.current = secureGroup;
    
    // Create lock body with classic padlock proportions - wider than tall with more rounding at the top
    const lockBodyWidth = 0.62; // Narrower for better classic padlock proportions
    const lockBodyHeight = 0.48; // Slightly shorter for better proportions
    const lockBodyDepth = 0.28; // Slightly thinner for better proportions
    
    // Create the main body using RoundedBoxGeometry for more realistic appearance
    const lockBodyGeometry = new RoundedBoxGeometry(
      lockBodyWidth, 
      lockBodyHeight, 
      lockBodyDepth, 
      16,    // More segments for smoother corners
      0.14   // Increased corner radius for more curvature, especially at the top
    );
    
    // Add subtle edge highlighting for better definition
    const lockBodyEdges = new THREE.EdgesGeometry(lockBodyGeometry);
    const lockBodyLines = new THREE.LineSegments(
      lockBodyEdges,
      new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.3 })
    );
    
    // Create more subtle notches at the top of the lock body where the shackle will connect
    // Use precise measurements for perfect alignment with the shackle
    const postWidth = 0.12; // Narrower for better proportions and less visible posts
    const postHeight = 0.02; // Much lower profile posts for a more streamlined look
    const postDepth = 0.22; // Slightly thinner to match the lock body
    const postSpacing = 0.36; // Precise distance between posts to match shackle arc
    
    // Create the left post geometry - slightly inset into the lock body
    const leftPostGeometry = new THREE.BoxGeometry(postWidth, postHeight, postDepth);
    const leftPostMesh = new THREE.Mesh(leftPostGeometry);
    leftPostMesh.position.set(-postSpacing/2, lockBodyHeight/2, 0);
    
    // Create the right post geometry - slightly inset into the lock body
    const rightPostGeometry = new THREE.BoxGeometry(postWidth, postHeight, postDepth);
    const rightPostMesh = new THREE.Mesh(rightPostGeometry);
    rightPostMesh.position.set(postSpacing/2, lockBodyHeight/2, 0);
    
    // Create small holes/notches where the shackle inserts - more subtle and integrated
    const holeRadius = 0.032; // Slightly smaller to match the shackle thickness exactly
    const holeDepth = 0.14; // Slightly shallower but still deep enough for realism
    
    // Position offset for holes - precisely aligned with the top of the posts
    const holeYOffset = lockBodyHeight/2 + postHeight/2;
    
    const leftHoleGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 24);
    const leftHoleMesh = new THREE.Mesh(leftHoleGeometry);
    leftHoleMesh.rotation.x = Math.PI/2;
    leftHoleMesh.position.set(-postSpacing/2, holeYOffset, 0);
    
    const rightHoleGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 24);
    const rightHoleMesh = new THREE.Mesh(rightHoleGeometry);
    rightHoleMesh.rotation.x = Math.PI/2;
    rightHoleMesh.position.set(postSpacing/2, holeYOffset, 0);
    
    // Create a more realistic U-shaped shackle with a uniform, smooth curve
    const shackleRadius = 0.19; // Larger radius for a more pronounced classic arc
    const shackleThickness = 0.032; // Slightly thinner for a more elegant appearance
    const shackleHeight = 0.24; // Taller height for a more classic padlock silhouette
    
    // Calculate the positions where the shackle meets the posts
    const leftAnchorX = -postSpacing/2;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rightAnchorX = postSpacing/2;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const anchorY = lockBodyHeight/2;
    
    // Create a pivot group for the shackle - this allows us to rotate around the left post
    const shacklePivotGroup = new THREE.Group();
    // Position exactly at the left hole for perfect pivoting
    shacklePivotGroup.position.set(leftAnchorX, holeYOffset, 0);
    
    // Create a single, smooth U shape with a continuous curve
    // Left vertical segment (fixed leg) - minimal extension into the lock body
    // Create a single, uniform half-circle arc for the entire shackle
    // This creates a symmetrical U-shape with both sides equally curved
    const shacklePath = [];
    
    // Calculate dimensions for a perfect half-circle
    const shackleDiameter = postSpacing; // Distance between anchors is the diameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const shackleArcRadius = shackleDiameter / 2; // Radius is half the diameter
    const baseY = -0.05; // Y position where arc connects to lock body
    // Increase the arc height for a more pronounced curve like in the reference image
    const arcHeight = (shackleHeight + shackleRadius) * 1.5; // Significantly increased height for more curved appearance
    
    // Use more segments for an ultra-smooth curve
    const arcSegments = 64;
    
    // Create points for the entire shackle as one continuous arc
    for (let i = 0; i <= arcSegments; i++) {
      const t = i / arcSegments; // Goes from 0 to 1
      const angle = Math.PI * t; // Half-circle (0 to π)
      
      // X position goes from 0 to postSpacing
      const x = postSpacing * t;
      
      // Y position follows a half-circle arc
      // Use sin function for the arc height, with baseY as the bottom position
      const y = baseY + Math.sin(angle) * arcHeight;
      
      shacklePath.push(new THREE.Vector3(x, y, 0));
    }
    
    // Create a smooth curve from all the points
    const shackleCurve = new THREE.CatmullRomCurve3(shacklePath);
    shackleCurve.tension = 0; // Zero tension for a perfect mathematical arc
    
    // Create a tube geometry for the shackle with higher quality settings
    const lockShackleGeometry = new THREE.TubeGeometry(
      shackleCurve,
      128, // Even more tubular segments for ultra-smooth curve
      shackleThickness, // radius - consistent thickness throughout
      36, // More radial segments for smoother cylinder
      false // not closed
    );
    
    // Create a silver material for the lock body for a realistic metal appearance
    const lockMaterial = new THREE.MeshPhysicalMaterial({
      color: lockBodyColor, // Silver color
      emissive: 0x222222, // Darker emissive for more depth
      emissiveIntensity: 0.04, // Minimal glow for subtle depth
      roughness: 0.18, // Smoother texture for more polished appearance
      metalness: 0.92, // Higher metalness for a more metallic look
      reflectivity: 0.92, // Higher reflectivity for metal
      clearcoat: 0.7, // More clearcoat for extra shine
      clearcoatRoughness: 0.15, // Lower clearcoat roughness for polish
      envMapIntensity: 1.3, // Slightly higher reflections
      transparent: false, // Solid material
      opacity: 1.0
    } as THREE.MeshPhysicalMaterialParameters);
    
    // Post material - make it closer to the lock body color for a more integrated look
    const postMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd8d8d8, // Closer to the lock body color for better integration
      emissive: 0x666666, // Subtle darker emissive
      emissiveIntensity: 0.01, // Very subtle glow
      roughness: 0.2, // Smoother for better reflections and integration with lock body
      metalness: 0.9, // More metallic to match lock body
      reflectivity: 0.9, // Higher reflectivity to match lock body
      clearcoat: 0.7, // More clearcoat for shine
      clearcoatRoughness: 0.2, // Slightly textured clearcoat
      envMapIntensity: 1.0, // Balanced env map intensity
      transparent: false,
      opacity: 1.0
    } as THREE.MeshPhysicalMaterialParameters);
    
    // Hole material - darker black to create more visual depth
    const holeMaterial = new THREE.MeshBasicMaterial({
      color: 0x080808, // Darker black for more depth
      transparent: false,
    });
    
    // Shackle material with bright silver/metallic appearance for clear distinction
    // Upgraded to MeshPhysicalMaterial for better reflections and consistency with lock body
    const shackleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf0f0f0, // Even brighter silver for better visibility and contrast with the lock body
      emissive: 0x444444, // Subtle silver glow
      emissiveIntensity: 0.04, // Very subtle glow
      roughness: 0.06, // Even smoother for a more polished, chrome-like look
      metalness: 0.99, // Maximum metalness for a perfect chrome-like appearance
      reflectivity: 0.99, // Maximum reflectivity for better highlights
      clearcoat: 0.95, // Maximum clearcoat for chrome-like finish
      clearcoatRoughness: 0.02, // Smoother clearcoat for more polish
      envMapIntensity: 2.0, // Higher environment map intensity for more pronounced reflections
      transparent: false // Fully opaque
    });
    
    // Create lock body - positioned completely upright
    const lockBody = new THREE.Mesh(lockBodyGeometry, lockMaterial);
    lockBody.rotation.x = 0; // No rotation on x-axis
    lockBody.rotation.y = 0; // No rotation on y-axis
    lockBody.rotation.z = 0; // No rotation on z-axis
    lockBody.position.y = 0; // Centered position
    lockBody.position.z = 0; // Centered at origin
    
    // Apply materials to the meshes
    leftPostMesh.material = postMaterial;
    rightPostMesh.material = postMaterial;
    leftHoleMesh.material = holeMaterial;
    rightHoleMesh.material = holeMaterial;
    
    // Add the posts and holes to the lock body
    lockBody.add(leftPostMesh);
    lockBody.add(rightPostMesh);
    lockBody.add(leftHoleMesh);
    lockBody.add(rightHoleMesh);
    lockBody.add(lockBodyLines); // Add subtle edge lines for better definition
    
    // Create lock shackle - initially in CLOSED position for the Shrink stage
    const lockShackle = new THREE.Mesh(lockShackleGeometry, shackleMaterial);
    
    // Add the shackle to the pivot group
    shacklePivotGroup.add(lockShackle);
    
    // The pivot group is positioned at the left post, so the shackle is already correctly positioned
    // Initial rotation is 0 (closed position)
    
    // Add a realistic keyhole near the bottom of the front face
    const keyholeGeometry = new THREE.CircleGeometry(0.06, 32); // Smaller keyhole
    const keyholeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: false,
      opacity: 1.0 // Fully opaque for maximum visibility
    });
    const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial);
    keyhole.position.z = lockBodyDepth/2 + 0.001; // Just in front of the lock face
    keyhole.position.y = -lockBodyHeight/2 + 0.1; // Very close to the bottom edge
    
    // Add keyhole detail - the vertical slot
    const keyholeSlotGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.01);
    const keyholeSlot = new THREE.Mesh(keyholeSlotGeometry, keyholeMaterial);
    keyholeSlot.position.z = lockBodyDepth/2 + 0.001;
    keyholeSlot.position.y = -lockBodyHeight/2 + 0.06; // Just below the keyhole circle
    
    // Add both keyhole parts to the lock body
    lockBody.add(keyhole);
    lockBody.add(keyholeSlot);
    
    // Add a metallic rim around the keyhole for definition
    const keyholeRimGeometry = new THREE.RingGeometry(0.06, 0.08, 32);
    const keyholeRimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x999999, // Slightly darker than the body for definition
      roughness: 0.1,
      metalness: 1.0,
      reflectivity: 1.0,
      side: THREE.DoubleSide
    });
    const keyholeRim = new THREE.Mesh(keyholeRimGeometry, keyholeRimMaterial);
    keyholeRim.position.z = lockBodyDepth/2 + 0.002; // Just in front of the keyhole
    keyholeRim.position.y = -lockBodyHeight/2 + 0.1; // Aligned with keyhole
    lockBody.add(keyholeRim);
    
    // Group lock parts
    const lock = new THREE.Group();
    lock.add(lockBody);
    
    // Ensure the lock is upright by setting the proper rotation
    lock.rotation.x = 0;  // No front/back tilt
    lock.rotation.y = 0;  // Keep it facing forward
    lock.rotation.z = 0;  // Keep it upright
    
    // Add the pivot group (containing the shackle) to the lock body
    lockBody.add(shacklePivotGroup);
    
    // Reference for animation - use the pivot group for rotation animations
    lockShackleRef.current = shacklePivotGroup;
    
    // Add extremely minimal pulsing animation that won't distort the lock shape at all
    // Use a proxy object to avoid the read-only scale property error
    const lockScaleProxy = { x: 1, y: 1, z: 1 };
    gsap.to(lockScaleProxy, {
      x: 1.005, y: 1.005, z: 1.005, // Barely perceptible scale change
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: () => {
        if (lock) {
          lock.scale.set(
            lockScaleProxy.x,
            lockScaleProxy.y,
            lockScaleProxy.z
          );
        }
      }
    });
    
    // Add a very minimal rotation that won't interfere with the shackle animation
    gsap.to(lock.rotation, {
      y: 0.01, // Extremely minimal rotation to maintain clear padlock silhouette
      x: 0.002, // Almost imperceptible tilt on x-axis
      duration: 12, // Even slower rotation for subtlety
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    
    // Removed the large green circle behind the padlock
    // const lockGlowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    // const lockGlowMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x20e8ac, // Light green color matching our theme
    //   transparent: true,
    //   opacity: 0.3, // Fixed opacity that remains constant
    //   side: THREE.BackSide
    // });
    // const lockGlow = new THREE.Mesh(lockGlowGeometry, lockGlowMaterial);
    // lockGlow.position.set(0, 0, -0.8); // Position behind the lock
    
    // Removed the general glow effect that was creating the green circle
    // const glowGeometry = new THREE.SphereGeometry(0.8, 24, 24);
    // const glowMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x20e8ac, // Light green color matching our theme
    //   transparent: true,
    //   opacity: 0.25, // Fixed opacity that remains constant
    //   side: THREE.BackSide
    // });
    // const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    // glow.position.copy(lock.position); // Position at the lock
    // secureGroup.add(glow); // Add to the secure group
    
    // Add a tiny spark effect for when the lock closes
    const sparkGeometry = new THREE.SphereGeometry(0.02, 12, 12); // Much smaller spark with fewer segments
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0 // Start invisible
    });
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    spark.position.set(postSpacing/2, lockBodyHeight/2, lockBodyDepth/2); // Position at the right hole
    lockBody.add(spark);
    // Removed the lockGlow from the lock
    // lock.add(lockGlow);
    
    secureGroup.add(lock);
    
    // Removed inner glow sphere that was creating the green circle
    // const innerGlowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    // const innerGlowMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x20ffb0, // Lighter green color
    //   transparent: true,
    //   opacity: 0.04, // Even lower opacity
    //   side: THREE.BackSide
    // });
    // const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    // secureGroup.add(innerGlow);
    
    // Removed middle glow sphere that was creating the green circle
    // const middleGlowGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    // const middleGlowMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x20e8ac, // Lighter green color
    //   transparent: true,
    //   opacity: 0.2,
    //   side: THREE.BackSide
    // });
    // 
    // const middleGlow = new THREE.Mesh(middleGlowGeometry, middleGlowMaterial);
    // secureGroup.add(middleGlow);
    
    // Removed outer glow sphere that was creating a green circle overlay
    // const outerGlowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    // const outerGlowMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x20e8ac, // Lighter green color
    //   transparent: true,
    //   opacity: 0.1,
    //   side: THREE.BackSide
    // });
    // 
    // const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    // secureGroup.add(outerGlow);
    
    // Removed animation for the outer glow
    // const outerGlowScaleProxy = { x: 1, y: 1, z: 1 };
    // gsap.to(outerGlowScaleProxy, {
    //   x: 1.2, y: 1.2, z: 1.2,
    //   duration: 2,
    //   repeat: -1,
    //   yoyo: true,
    //   ease: "sine.inOut",
    //   onUpdate: () => {
    //     if (outerGlow) {
    //       outerGlow.scale.set(
    //         outerGlowScaleProxy.x,
    //         outerGlowScaleProxy.y,
    //         outerGlowScaleProxy.z
    //       );
    //     }
    //   }
    // });
    
    // Add orbiting particles for dynamic effect - more particles and variety
    const orbitCount = 12; // Increased count
    
    // Multiple geometry types for visual interest
    const orbitGeometries = [
      new THREE.IcosahedronGeometry(0.08, 0),
      new THREE.OctahedronGeometry(0.1, 0),
      new THREE.TetrahedronGeometry(0.12)
    ];
    
    // Enhanced material with a more subtle glow
    const orbitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4adeb0, // Lighter green color
      emissive: 0x20ffb0, // Lighter emissive color
      emissiveIntensity: 0.8, // Reduced from 1.5 to 0.8 for a more minimal look
      metalness: 0.7,
      roughness: 0.3,
      reflectivity: 0.8,
      clearcoat: 0.4
    } as THREE.MeshPhysicalMaterialParameters);
    
    // Store all animation timelines for proper cleanup
    const orbitAnimations: gsap.core.Tween[] = [];
    
    // Create two orbital rings at different angles
    for (let ring = 0; ring < 2; ring++) {
      const ringAngle = ring * Math.PI / 4; // Angle between rings
      
      // Create orbital path with rotation
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.x = ringAngle;
      secureGroup.add(orbitGroup);
      
      for (let i = 0; i < orbitCount; i++) {
        // Randomly select geometry
        const geometryIndex = Math.floor(Math.random() * orbitGeometries.length);
        const geometry = orbitGeometries[geometryIndex];
        const material = orbitMaterial.clone();
        const orbitParticle = new THREE.Mesh(geometry, material);
        
        // Position in orbit
        const angle = (i / orbitCount) * Math.PI * 2;
        const radius = 1.6 + ring * 0.2; // Different radius per ring
        
        orbitParticle.position.x = Math.cos(angle) * radius;
        orbitParticle.position.z = Math.sin(angle) * radius;
        
        // Add slight random offset
        orbitParticle.position.y = (Math.random() - 0.5) * 0.1;
        
        // Add scale variation
        const scale = 0.8 + Math.random() * 0.4;
        orbitParticle.scale.set(scale, scale, scale);
        
        // Add color variation
        if (material instanceof THREE.MeshPhysicalMaterial) {
          const hueShift = (Math.random() - 0.5) * 0.1;
          material.color.offsetHSL(hueShift, 0, 0);
          material.emissive.offsetHSL(hueShift, 0, 0);
        }
        
        // Add to group first before animating
        orbitGroup.add(orbitParticle);
        
        // Animate each particle individually
        const particleAnim = gsap.to(orbitParticle.position, {
          y: orbitParticle.position.y + (Math.random() * 0.2 - 0.1),
          duration: 1 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        orbitAnimations.push(particleAnim);
      }
      
      // Animate the orbit rotation
      const rotationAnim = gsap.to(orbitGroup.rotation, {
        y: Math.PI * 2,
        duration: 10 + (ring * 5), // Different speeds per ring
        repeat: -1,
        ease: "none"
      });
      orbitAnimations.push(rotationAnim);
    }
    
    // Store the setup function for later use
    timelineRef.current = setupAnimation();
    
    // Ensure shred group is completely hidden on mount
    if (shredGroupRef.current) {
      shredGroupRef.current.visible = false;
      // Use gsap to set opacity on the group instead of directly accessing the property
      gsap.set(shredGroupRef.current, { opacity: 0 });
    }
    
    // Clean up function - properly dispose of all resources
    return () => {
      // Cancel any pending animation frames first
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Kill all animations
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      
      // Ensure all ScrollTrigger instances are killed
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
      
      // Kill orbit animations
      orbitAnimations.forEach(anim => anim.kill());
      
      // Dispose of geometries and materials safely
      [lockBodyGeometry, leftPostGeometry, rightPostGeometry, leftHoleGeometry, rightHoleGeometry, 
       lockShackleGeometry, keyholeGeometry, keyholeSlotGeometry, keyholeRimGeometry,
       /* All glow geometries removed */
       ...orbitGeometries].forEach(geometry => {
         if (geometry && typeof geometry.dispose === 'function') {
           geometry.dispose();
         }
       });
      
      [lockMaterial, postMaterial, holeMaterial, shackleMaterial, keyholeMaterial, keyholeRimMaterial,
       /* All glow materials removed */].forEach(material => {
        if (material && typeof material.dispose === 'function') {
          material.dispose();
        }
      });
      
      // Remove objects from scene safely
      if (secureGroup && secureGroup.parent) {
        secureGroup.parent.remove(secureGroup);
      }
      
      // Clean up renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Clean up scene
      if (sceneRef.current) {
        // Remove all children from scene
        while (sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0]);
        }
      }
    };
  }, [setupTimeline, animateObjects, setupAnimation]);
  
  // Handle window resize
  
  useEffect(() => {
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
      
      // Use container dimensions instead of window dimensions
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const isSmallScreen = containerWidth < 768;
      
      // Update mobile state for use in animations
      setIsMobile(isSmallScreen);
      
      // Adjust camera settings for mobile
      if (isSmallScreen) {
        // Wider FOV and pulled back camera for mobile to ensure the scene fits
        cameraRef.current.fov = 75; // wider FOV for better visibility on small screens
        cameraRef.current.position.z = 6; // pull back to show more of the scene
        cameraRef.current.position.y = 0.2; // slight adjustment to center the view better
      } else {
        // Default settings for desktop
        cameraRef.current.fov = 65;
        cameraRef.current.position.z = 5;
        cameraRef.current.position.y = 0;
      }
      
      // Update camera aspect ratio
      cameraRef.current.aspect = containerWidth / containerHeight;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer size
      rendererRef.current.setSize(containerWidth, containerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollContainerId]);
  
  // Additional cleanup effect specifically for ScrollTrigger
  useEffect(() => {
    return () => {
      // Ensure all ScrollTrigger instances are killed on component unmount
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
    };
  }, [scrollContainerId]);
  
  // Calculate progress bar colors based on scroll progress
  const getProgressBarColors = (): ProgressBarColors => {
    // Colors for each stage
    const shrinkColor = '#3b82f6'; // Blue
    const shredColor = '#f97316'; // Orange
    const secureColor = '#10b981'; // Green
    
    // Use actual scroll progress instead of fixed values
    if (scrollProgress < 33) {
      // Shrink stage (0-33%)
      return { 
        from: shrinkColor, 
        to: shredColor, 
        progress: scrollProgress,
        stageName: 'Shrink'
      };
    } else if (scrollProgress < 66) {
      // Shred stage (33-66%)
      return { 
        from: shredColor, 
        to: secureColor, 
        progress: scrollProgress,
        stageName: 'Shred'
      };
    } else {
      // Secure stage (66-100%)
      return { 
        from: secureColor, 
        to: secureColor, 
        progress: scrollProgress,
        stageName: 'Secure'
      };
    }
  };
  
  const { from, to, progress } = getProgressBarColors();
  
  return (
    <div ref={containerRef} className="w-full h-full" style={{ zIndex: 5 }}>
      {/* Canvas takes up the full container - using a stable key to prevent remounting */}
      <canvas 
        ref={canvasRef} 
        key="data-protection-canvas"
        className="w-full h-full z-10" 
        style={{ display: 'block' }} 
      />
      
      {/* Progress Bar Container - Repositioned to avoid overlap with buttons */}
      <div className="fixed z-40 flex flex-col items-start bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-gray-800/50"
        style={{
          width: isMobile ? '120px' : '160px',
          right: isMobile ? '1rem' : '2rem',
          top: isMobile ? 'auto' : '70vh',
          bottom: isMobile ? '1rem' : 'auto',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
        {/* Stage Title - Shows current stage with smaller font */}
        <div className="mb-2 font-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>
          <span 
            className="transition-all duration-300"
            style={{
              color: from,
              textShadow: `0 0 10px ${from}80`
            }}
          >
            {getProgressBarColors().stageName}
          </span>
          <span className="text-gray-400"> Progress</span>
        </div>
        
        {/* Vertical Progress Bar */}
        <div className="flex items-center space-x-2 mb-2">
          {/* Vertical Bar - Made thinner and shorter on mobile */}
          <div 
            className="w-1.5 bg-gray-800/90 backdrop-blur-md rounded-full overflow-hidden shadow-lg shadow-black/50 border border-gray-700/50"
            style={{ height: isMobile ? '90px' : '120px' }}
          >
            {/* Progress Indicator */}
            <div 
              className="w-full transition-all duration-300 ease-out rounded-full" 
              style={{
                height: `${progress}%`,
                background: `linear-gradient(to top, ${from}, ${to})`,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>
          
          {/* Stage Indicators - Using spans to avoid bullet points */}
          <div 
            className="flex flex-col justify-between text-xs font-medium"
            style={{ height: isMobile ? '90px' : '120px' }}
          >
            <span 
              className={`transition-all duration-300 ${scrollProgress < 33 ? 'text-blue-300 scale-110' : 'text-gray-400'}`}
              style={{ 
                opacity: scrollProgress < 33 ? 1 : 0.7,
                textShadow: scrollProgress < 33 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                display: 'inline-block'
              }}
            >
              Shrink
            </span>
            <span 
              className={`transition-all duration-300 ${scrollProgress >= 33 && scrollProgress < 66 ? 'text-orange-300 scale-110' : 'text-gray-400'}`}
              style={{ 
                opacity: scrollProgress >= 33 && scrollProgress < 66 ? 1 : 0.7,
                textShadow: scrollProgress >= 33 && scrollProgress < 66 ? '0 0 10px rgba(249, 115, 22, 0.5)' : 'none',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                display: 'inline-block'
              }}
            >
              Shred
            </span>
            <span 
              className={`transition-all duration-300 ${scrollProgress >= 66 ? 'text-green-300 scale-110' : 'text-gray-400'}`}
              style={{ 
                opacity: scrollProgress >= 66 ? 1 : 0.7,
                textShadow: scrollProgress >= 66 ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                display: 'inline-block'
              }}
            >
              Secure
            </span>
          </div>
        </div>
        
        {/* Percentage Display */}
        <div 
          className="font-mono text-gray-300"
          style={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
        >
          {Math.round(progress)}% complete
        </div>
      </div>
    </div>
  );
};

export default DataProtectionJourney;