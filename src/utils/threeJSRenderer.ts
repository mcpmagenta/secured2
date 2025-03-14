/**
 * threeJSRenderer.ts
 * 
 * This utility provides a way to initialize and manage Three.js scenes
 * outside of the React component lifecycle, avoiding DOM reconciliation issues.
 */

import * as THREE from 'three';

// Types for the initialization parameters
interface ThreeJSSceneInitParams {
  container: HTMLElement;
  updateProgress?: (progress: number) => void;
}

// Types for the scene update event
interface SceneUpdateEventDetail {
  progress: number;
  currentPhase: string;
  phaseColors: Record<string, string>;
}

/**
 * Initialize a Three.js scene in the provided container
 * This approach bypasses React's rendering cycle completely
 */
export function initThreeJSScene({ container, updateProgress }: ThreeJSSceneInitParams): () => void {
  // Create scene, camera, and renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  
  // Configure renderer
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Add renderer to the DOM
  container.appendChild(renderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const pointLight1 = new THREE.PointLight(0xffffff, 1);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0x0ea5e9, 0.5);
  pointLight2.position.set(-10, -10, -10);
  scene.add(pointLight2);
  
  const spotLight = new THREE.SpotLight(0x38bdf8, 0.5);
  spotLight.position.set(0, 5, 0);
  spotLight.angle = 0.3;
  spotLight.penumbra = 0.8;
  spotLight.castShadow = true;
  scene.add(spotLight);
  
  // Create data visualization objects
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x0ea5e9 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  
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
  
  // Position camera
  camera.position.z = 5;
  
  // Current animation state
  let currentProgress = 0;
  let currentPhase = 'intro';
  let phaseColors: Record<string, string> = {
    intro: '#0ea5e9',
    shrink: '#38bdf8',
    shred: '#0284c7',
    secure: '#0369a1'
  };
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate cube based on progress
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    // Scale cube based on progress (shrink phase)
    const scale = Math.max(0.2, 1 - currentProgress * 0.8);
    cube.scale.set(scale, scale, scale);
    
    // Rotate particles
    particles.rotation.x += 0.001;
    particles.rotation.y += 0.002;
    
    // Update particle positions based on phase
    if (currentPhase === 'shred') {
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] += (Math.random() - 0.5) * 0.02;
        positions[i3 + 1] += (Math.random() - 0.5) * 0.02;
        positions[i3 + 2] += (Math.random() - 0.5) * 0.02;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Update material colors based on phase
    if (phaseColors[currentPhase]) {
      const color = new THREE.Color(phaseColors[currentPhase]);
      material.color.set(color);
      particleMaterial.color.set(color);
    }
    
    // Render scene
    renderer.render(scene, camera);
    
    // Call update callback if provided
    if (updateProgress) {
      updateProgress(currentProgress);
    }
  }
  
  // Start animation loop
  animate();
  
  // Handle window resize
  function handleResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  window.addEventListener('resize', handleResize);
  
  // Handle scene updates from React component
  function handleSceneUpdate(event: CustomEvent<SceneUpdateEventDetail>) {
    const { progress, currentPhase: phase, phaseColors: colors } = event.detail;
    currentProgress = progress;
    currentPhase = phase;
    phaseColors = colors;
  }
  
  window.addEventListener('update-three-js', handleSceneUpdate as EventListener);
  
  // Return cleanup function
  return () => {
    // Stop animation loop
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('update-three-js', handleSceneUpdate as EventListener);
    
    // Dispose of Three.js resources
    scene.remove(cube);
    scene.remove(particles);
    geometry.dispose();
    material.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
    renderer.dispose();
  };
}
