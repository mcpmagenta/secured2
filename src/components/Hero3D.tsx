import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

// Shader for the colorful curved shape
const fragmentShader = `
  uniform float time;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  
  varying vec2 vUv;
  
  void main() {
    float t = time * 0.2;
    
    // Create a flowing color effect
    vec3 colorA = mix(color1, color2, sin(vUv.x * 3.14 + t) * 0.5 + 0.5);
    vec3 colorB = mix(color2, color3, sin(vUv.y * 3.14 + t * 1.3) * 0.5 + 0.5);
    vec3 finalColor = mix(colorA, colorB, sin((vUv.x + vUv.y) * 5.0 + t * 0.7) * 0.5 + 0.5);
    
    // Add some glow and transparency at the edges
    float alpha = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    alpha *= 0.8;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Curved Shape Component
const CurvedShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Create a curved shape using a TorusGeometry instead of ParametricBufferGeometry
  // which is no longer available in the current version of Three.js
  const geometry = new THREE.TorusGeometry(4, 1.5, 30, 30, Math.PI * 0.5);
  
  // Animation
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.2) * 0.05;
    }
  });
  
  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -1, -3]} rotation={[0.2, 0, 0]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        uniforms={{
          time: { value: 0 },
          color1: { value: new THREE.Color('#4dabf7') },
          color2: { value: new THREE.Color('#ae3ec9') },
          color3: { value: new THREE.Color('#20c997') }
        }}
      />
    </mesh>
  );
};

// Floating 3D Logo
const Logo3D = () => {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 0.5, 0]}>
        {/* S shape */}
        <mesh position={[-0.3, 0, 0]} castShadow>
          <torusGeometry args={[0.3, 0.1, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#4dabf7" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.3, -0.4, 0]} rotation={[0, 0, Math.PI]} castShadow>
          <torusGeometry args={[0.3, 0.1, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#4dabf7" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* 2 shape */}
        <group position={[0.3, 0, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.5, 0.1, 0.1]} />
            <meshStandardMaterial color="#ae3ec9" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.2, -0.1, 0]} castShadow>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial color="#ae3ec9" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.5, 0.1, 0.1]} />
            <meshStandardMaterial color="#ae3ec9" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </Float>
  );
};

// Floating Text Elements
const FloatingElements = () => {
  return (
    <group>
      {/* Security-related terms floating in 3D space */}
      {[
        { text: "Quantum-Secure", position: [-2, 1.5, -1], color: "#4dabf7" },
        { text: "AI-Safe", position: [2, 1.2, -2], color: "#ae3ec9" },
        { text: "Military-Grade", position: [-1.5, -1, -1.5], color: "#20c997" },
        { text: "Encryption", position: [1.8, -1.3, -1], color: "#4dabf7" },
      ].map((item, index) => (
        <Float key={index} speed={1} rotationIntensity={0.3} floatIntensity={0.5}>
          <Text
            position={item.position as [number, number, number]}
            fontSize={0.2}
            color={item.color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-medium.woff"
          >
            {item.text}
          </Text>
        </Float>
      ))}
    </group>
  );
};

// Main Scene Component
const HeroScene = () => {
  const { camera } = useThree();
  
  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 0, 5);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4dabf7" />
      
      <CurvedShape />
      <Logo3D />
      <FloatingElements />
    </>
  );
};

// Main Component with Canvas
const Hero3D = () => {
  return (
    <div className="w-full h-[600px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
      >
        <HeroScene />
      </Canvas>
    </div>
  );
};

export default Hero3D;
