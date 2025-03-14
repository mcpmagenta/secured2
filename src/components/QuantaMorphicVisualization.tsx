"use client";

import { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion, useSpring, useTransform, MotionValue, Variants } from 'framer-motion';
import { PerspectiveCamera, Environment, Stars, Preload } from '@react-three/drei';
import * as THREE from 'three';
import dynamic from 'next/dynamic';

const DataTransformScene = dynamic(() => import('./DataTransformScene'), {
  ssr: false,
  loading: () => null
});

const DataObject = dynamic(() => import('./DataObject'), {
  ssr: false,
  loading: () => null
});


interface QuantaMorphicVisualizationProps {
  scrollProgress: MotionValue<number>;
}

function AnimatedCamera({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const cameraY = useTransform(scrollProgress, [0, 1], [2, -2]);
  const cameraX = useTransform(scrollProgress, [0, 0.3, 0.5, 0.7, 1], [0, 2, 0, -2, 0]);

  useFrame(() => {
    if (cameraRef.current) {
      cameraRef.current.position.x = cameraX.get();
      cameraRef.current.position.y = cameraY.get();
      cameraRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0, 0, 8]}
      fov={60}
    />
  );
}

function DynamicLights({ shrinkProgress, shredProgress, secureProgress }: { shrinkProgress: number; shredProgress: number; secureProgress: number }) {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (light1.current) {
      light1.current.position.x = 10 + shrinkProgress * 2;
      light1.current.position.y = 10 - shredProgress * 5;
      light1.current.position.z = 10 - secureProgress * 3;
    }
    if (light2.current) {
      light2.current.position.x = -5 + shredProgress * 3;
      light2.current.position.y = 5 - secureProgress * 2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight
        ref={light1}
        position={[10, 10, 10]}
        intensity={1.5}
        color="#4299e1"
      />
      <pointLight
        ref={light2}
        position={[-5, 5, 5]}
        intensity={1.2}
        color="#60a5fa"
      />
    </>
  );
}

// Animation variants for consistent motion effects
const textVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function QuantaMorphicVisualization({ scrollProgress }: QuantaMorphicVisualizationProps) {
  const [starCount] = useState(500);
  
  // Calculate progress for each phase based on overall scroll with adjusted ranges
  const shrinkProgress = useTransform(scrollProgress, [0.1, 0.3], [0, 1]);
  const shredProgress = useTransform(scrollProgress, [0.3, 0.5], [0, 1]);
  const secureProgress = useTransform(scrollProgress, [0.5, 0.7], [0, 1]);

  const smoothShrinkProgress = useSpring(shrinkProgress, {
    stiffness: 30,
    damping: 10,
    restDelta: 0.001
  });

  const smoothShredProgress = useSpring(shredProgress, {
    stiffness: 30,
    damping: 10,
    restDelta: 0.001
  });

  const smoothSecureProgress = useSpring(secureProgress, {
    stiffness: 30,
    damping: 10,
    restDelta: 0.001
  });

  // Track scroll direction for animations
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  useEffect(() => {
    let lastScrollValue = scrollProgress.get();
    
    const unsubscribe = scrollProgress.on('change', (current) => {
      setScrollDirection(current > lastScrollValue ? 'down' : 'up');
      lastScrollValue = current;
    });

    return () => unsubscribe();
  }, [scrollProgress]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        className="w-full h-full"
        gl={{
          antialias: true,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#000000"]} />
          <fog attach="fog" args={["#000000", 5, 15]} />
          
          {/* Animated camera that follows scroll */}
          <AnimatedCamera scrollProgress={scrollProgress} />
          
          {/* Dynamic lighting based on scroll position */}
          <DynamicLights
            shrinkProgress={smoothShrinkProgress.get()}
            shredProgress={smoothShredProgress.get()}
            secureProgress={smoothSecureProgress.get()}
          />
          
          <Stars count={starCount} depth={50} fade speed={1} />
          
          {/* Unified animations container */}
          <group position={[0, 0, 0]}>
            <DataTransformScene scrollProgress={scrollProgress} />
            
            {/* Data object that flows through all sections */}
            <DataObject
              shrinkProgress={smoothShrinkProgress.get()}
              shredProgress={smoothShredProgress.get()}
              secureProgress={smoothSecureProgress.get()}
            />
          </group>
          
          <Environment preset="city" />
          <Preload all />
        </Suspense>
      </Canvas>

      {/* Section descriptions */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute left-8 top-1/2 -translate-y-1/2 w-1/3 p-8 bg-black/40 backdrop-blur-sm rounded-lg border border-blue-400/20"
          initial={{ opacity: 0, x: scrollDirection === 'down' ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h2
            className="text-4xl font-bold text-blue-400 mb-4 drop-shadow-lg"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            1. Shrink
          </motion.h2>
          <motion.p
            className="text-xl text-gray-300 leading-relaxed drop-shadow"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Our advanced compression algorithms optimize your data, reducing its size while maintaining integrity.
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute right-8 top-1/2 -translate-y-1/2 w-1/3 p-8 bg-black/40 backdrop-blur-sm rounded-lg border border-blue-400/20"
          initial={{ opacity: 0, x: scrollDirection === 'down' ? 50 : -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <motion.h2
            className="text-4xl font-bold text-blue-400 mb-4 drop-shadow-lg"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            2. Shred
          </motion.h2>
          <motion.p
            className="text-xl text-gray-300 leading-relaxed drop-shadow"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            We fragment the compressed data into multiple pieces, making it virtually impossible to reconstruct without proper authorization.
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute right-8 bottom-1/4 w-1/3 p-8 bg-black/40 backdrop-blur-sm rounded-lg border border-blue-400/20"
          initial={{ opacity: 0, x: scrollDirection === 'down' ? 50 : -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        >
          <motion.h2
            className="text-4xl font-bold text-blue-400 mb-4 drop-shadow-lg"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            3. Secure
          </motion.h2>
          <motion.p
            className="text-xl text-gray-300 leading-relaxed drop-shadow"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Finally, we secure each fragment using military-grade encryption, ensuring your data remains protected at all times.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
