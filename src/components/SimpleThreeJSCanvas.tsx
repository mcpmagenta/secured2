"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SimpleThreeJSCanvasProps {
  progress: number;
  currentPhase: string;
  phaseColors: Record<string, string>;
}

/**
 * A simplified Three.js canvas component that avoids React DOM errors
 * by using a more direct approach to Three.js integration
 */
const SimpleThreeJSCanvas: React.FC<SimpleThreeJSCanvasProps> = ({ 
  progress, 
  currentPhase, 
  phaseColors 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Clear any existing canvas
    while (canvasRef.current.firstChild) {
      canvasRef.current.removeChild(canvasRef.current.firstChild);
    }

    // Add renderer to DOM
    canvasRef.current.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0ea5e9, 0.5);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Create data visualization objects
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x0ea5e9 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    // Add particles for data visualization
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 10;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 10;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.05 });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Clean up function
    // Store a reference to the canvas element at the time the effect runs
    const canvas = canvasRef.current;
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current) {
        if (canvas?.contains(rendererRef.current.domElement)) {
          canvas.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      
      if (cubeRef.current) {
        cubeRef.current.geometry.dispose();
        (cubeRef.current.material as THREE.Material).dispose();
      }
      
      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
      }
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const animate = () => {
      if (!cubeRef.current || !particlesRef.current) return;
      
      // Rotate cube
      cubeRef.current.rotation.x += 0.01;
      cubeRef.current.rotation.y += 0.01;
      
      // Scale cube based on progress (shrink phase)
      const scale = Math.max(0.2, 1 - progress * 0.8);
      cubeRef.current.scale.set(scale, scale, scale);
      
      // Rotate particles
      particlesRef.current.rotation.x += 0.001;
      particlesRef.current.rotation.y += 0.002;
      
      // Update particle positions based on phase
      if (currentPhase === 'shred') {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < 1000; i++) {
          const i3 = i * 3;
          positions[i3] += (Math.random() - 0.5) * 0.02;
          positions[i3 + 1] += (Math.random() - 0.5) * 0.02;
          positions[i3 + 2] += (Math.random() - 0.5) * 0.02;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
      
      // Update material colors based on phase
      if (phaseColors[currentPhase]) {
        const color = new THREE.Color(phaseColors[currentPhase]);
        (cubeRef.current.material as THREE.MeshStandardMaterial).color.set(color);
        (particlesRef.current.material as THREE.PointsMaterial).color.set(color);
      }
      
      // Render scene
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [progress, currentPhase, phaseColors]);

  return <div ref={canvasRef} className="w-full h-full" />;
};

export default SimpleThreeJSCanvas;
