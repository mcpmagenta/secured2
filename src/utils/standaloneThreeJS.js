// standaloneThreeJS.js - A completely standalone Three.js renderer
// This file is intentionally a .js file (not .ts or .tsx) to ensure it's completely separate from React

import * as THREE from 'three';

let scene, camera, renderer, cube, particles;
let animationId = null;
let isInitialized = false;

// Configuration options
const config = {
  progress: 0,
  currentPhase: 'intro',
  phaseColors: {
    intro: '#0ea5e9',
    shred: '#3b82f6',
    encrypt: '#6366f1',
    distribute: '#8b5cf6',
    reassemble: '#a855f7'
  }
};

// Initialize the Three.js scene
export function initScene(containerId) {
  // If already initialized, clean up first
  if (isInitialized) {
    cleanupScene();
  }

  // Get the container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found`);
    return false;
  }

  // Create scene
  scene = new THREE.Scene();

  // Create camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Clear any existing canvas
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Add renderer to DOM
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

  // Create data visualization objects
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x0ea5e9 });
  cube = new THREE.Mesh(geometry, material);
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
  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Handle window resize
  const handleResize = () => {
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener('resize', handleResize);

  // Start animation loop
  animate();
  
  isInitialized = true;
  return true;
}

// Animation loop
function animate() {
  if (!scene || !camera || !renderer || !cube || !particles) return;
  
  // Rotate cube
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  
  // Scale cube based on progress (shrink phase)
  const scale = Math.max(0.2, 1 - config.progress * 0.8);
  cube.scale.set(scale, scale, scale);
  
  // Rotate particles
  particles.rotation.x += 0.001;
  particles.rotation.y += 0.002;
  
  // Update particle positions based on phase
  if (config.currentPhase === 'shred') {
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < 1000; i++) {
      const i3 = i * 3;
      positions[i3] += (Math.random() - 0.5) * 0.02;
      positions[i3 + 1] += (Math.random() - 0.5) * 0.02;
      positions[i3 + 2] += (Math.random() - 0.5) * 0.02;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }
  
  // Update material colors based on phase
  if (config.phaseColors[config.currentPhase]) {
    const color = new THREE.Color(config.phaseColors[config.currentPhase]);
    cube.material.color.set(color);
    particles.material.color.set(color);
  }
  
  // Render scene
  renderer.render(scene, camera);
  
  // Continue animation loop
  animationId = requestAnimationFrame(animate);
}

// Update the scene configuration
export function updateScene(options = {}) {
  if (!isInitialized) return false;
  
  // Update config with new options
  Object.assign(config, options);
  return true;
}

// Clean up the scene
export function cleanupScene() {
  if (!isInitialized) return;
  
  // Cancel animation frame
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // Dispose of Three.js resources
  if (cube) {
    cube.geometry.dispose();
    cube.material.dispose();
    scene.remove(cube);
    cube = null;
  }
  
  if (particles) {
    particles.geometry.dispose();
    particles.material.dispose();
    scene.remove(particles);
    particles = null;
  }
  
  // Dispose of renderer
  if (renderer) {
    renderer.dispose();
    const canvas = renderer.domElement;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    renderer = null;
  }
  
  // Clear scene
  if (scene) {
    while (scene.children.length > 0) {
      const object = scene.children[0];
      scene.remove(object);
    }
    scene = null;
  }
  
  camera = null;
  isInitialized = false;
  
  // Remove resize event listener
  window.removeEventListener('resize', handleResize);
}

// Handle resize
function handleResize() {
  if (!camera || !renderer) return;
  
  const container = renderer.domElement.parentElement;
  if (!container) return;
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
