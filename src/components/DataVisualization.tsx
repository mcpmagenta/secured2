"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface DataVisualizationProps {
  progress: number;
  currentPhase: string;
  phaseColors: Record<string, string>;
}

/**
 * A CSS-based visualization component that replaces the Three.js visualization
 * This approach completely avoids the React DOM errors by using only React-compatible rendering
 */
const DataVisualization: React.FC<DataVisualizationProps> = ({ 
  progress, 
  currentPhase, 
  phaseColors 
}) => {
  // Get the current color based on the phase
  const currentColor = phaseColors[currentPhase] || '#0ea5e9';
  
  // Generate particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10
  }));
  
  // Animation variants based on the current phase
  const getAnimationVariants = () => {
    switch (currentPhase) {
      case 'shred':
        return {
          animate: {
            scale: [1, 1.5, 0.8, 1],
            rotate: [0, 90, 180, 270, 360],
            transition: { duration: 4, repeat: Infinity }
          }
        };
      case 'encrypt':
        return {
          animate: {
            opacity: [1, 0.5, 1],
            scale: [1, 0.8, 1],
            transition: { duration: 3, repeat: Infinity }
          }
        };
      case 'distribute':
        return {
          animate: {
            x: [0, 100, 0, -100, 0],
            y: [0, 50, 0, -50, 0],
            transition: { duration: 5, repeat: Infinity }
          }
        };
      case 'reassemble':
        return {
          animate: {
            scale: [0.5, 1, 0.5],
            rotate: [0, 180, 360],
            transition: { duration: 4, repeat: Infinity }
          }
        };
      default: // intro
        return {
          animate: {
            scale: [1, 1.2, 1],
            transition: { duration: 3, repeat: Infinity }
          }
        };
    }
  };
  
  const centerVariants = getAnimationVariants();
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 bg-gradient-radial from-transparent to-gray-900"
        style={{ 
          opacity: 0.7 + progress * 0.3
        }}
      />
      
      {/* Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: currentColor,
            opacity: 0.6
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
      
      {/* Central visualization */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          variants={centerVariants}
          animate="animate"
        >
          {/* Central cube/sphere */}
          <motion.div
            className="w-32 h-32 rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderWidth: '2px',
              borderColor: currentColor,
              boxShadow: `0 0 20px ${currentColor}`
            }}
            animate={{
              rotate: 360,
              scale: [1, 1 - progress * 0.3, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="text-white font-bold text-xl">
              {Math.round(progress * 100)}%
            </div>
          </motion.div>
          
          {/* Orbiting elements */}
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-full"

              animate={{
                rotate: 360,
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 5 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.5
              }}
              style={{
                top: '50%',
                left: '50%',
                x: `calc(${80 + i * 30}px * cos(${i * 120}deg))`,
                y: `calc(${80 + i * 30}px * sin(${i * 120}deg))`,
                backgroundColor: currentColor,
                boxShadow: `0 0 10px ${currentColor}`
              }}
            />
          ))}
        </motion.div>
      </div>
      
      {/* Phase label */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div 
          className="inline-block px-4 py-2 rounded-full text-white font-medium"
          style={{ backgroundColor: `${currentColor}50` }}
        >
          QuantaMorphic® {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;
