"use client";

import React, { memo, useMemo } from 'react';

// Define the phases of the QuantaMorphic® Technology
const PHASES = [
  {
    id: 'data',
    label: 'Your Data',
    color: '#0ea5e9',
    description: 'Your sensitive data before QuantaMorphic® protection.',
    threshold: 0
  },
  {
    id: 'shrink',
    label: 'Shrink',
    color: '#3b82f6',
    description: 'Data is compressed to minimize storage requirements.',
    threshold: 0.25
  },
  {
    id: 'shred',
    label: 'Shred',
    color: '#8b5cf6',
    description: 'Data is shredded into fragments and distributed securely.',
    threshold: 0.5
  },
  {
    id: 'secure',
    label: 'Secure',
    color: '#10b981',
    description: 'Data is secured with military-grade encryption and authentication.',
    threshold: 0.75
  }
];

interface DataJourneyProps {
  scrollProgress?: number;
}

/**
 * DataJourney Component - Visualizes the QuantaMorphic® Technology
 * Uses pure CSS-based animations to avoid React DOM errors
 * Memoized to prevent unnecessary re-renders
 */
function DataJourney({ scrollProgress = 0 }: DataJourneyProps) {
  // Find the current phase based on scroll progress
  const currentPhaseIndex = useMemo(() => {
    return PHASES.reduce((highestIndex, phase, index) => {
      return scrollProgress >= phase.threshold ? index : highestIndex;
    }, 0);
  }, [scrollProgress]);
  
  const currentPhase = PHASES[currentPhaseIndex];
  const progressPercentage = Math.round(scrollProgress * 100);
  
  // Calculate the number of data particles to show based on the phase
  const particleCount = useMemo(() => {
    if (currentPhaseIndex === 0) return 16; // Original data
    if (currentPhaseIndex === 1) return 9;  // Shrink phase
    if (currentPhaseIndex === 2) return 25; // Shred phase (more particles but smaller)
    return 16; // Secure phase
  }, [currentPhaseIndex]);
  
  // Generate an array of particles for visualization
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      // Different sizes based on phase
      const size = currentPhaseIndex === 2 ? '8px' : '12px';
      
      // Different colors based on phase
      let color = currentPhase.color;
      if (currentPhaseIndex === 3) {
        // For secure phase, alternate between colors for visual effect
        color = i % 2 === 0 ? '#10b981' : '#0ea5e9';
      }
      
      return { id: i, size, color };
    });
  }, [particleCount, currentPhaseIndex, currentPhase.color]);
  
  return (
    <div className="w-full h-[800px] bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      {/* Static container to prevent DOM reconciliation issues */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Phase indicator */}
        <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: currentPhase.color }}
            />
            <span className="font-medium">{currentPhase.label}</span>
            <span className="ml-auto text-sm">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full" 
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: currentPhase.color,
                transition: 'width 0.3s ease-out, background-color 0.5s ease' 
              }}
            />
          </div>
        </div>
        
        {/* CSS-based data visualization */}
        <div className="relative w-64 h-64">
          <div className="grid grid-cols-4 gap-4">
            {particles.map((particle) => (
              <div 
                key={particle.id}
                className="rounded-lg animate-pulse"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 15px ${particle.color}`,
                  animationDuration: `${1 + (particle.id % 3)}s`,
                  transition: 'all 0.5s ease'
                }}
              />
            ))}
          </div>
          
          {/* Central glow effect */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle, ${currentPhase.color} 0%, transparent 70%)`,
              transition: 'background 0.5s ease'
            }}
          />
        </div>
        
        {/* Phase description */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <div className="bg-black/60 backdrop-blur-sm mx-auto max-w-md rounded-lg p-4 text-white">
            <h3 className="text-xl font-bold mb-2">QuantaMorphic® Technology</h3>
            <p className="text-sm">{currentPhase.description}</p>
          </div>
        </div>
        
        {/* Phase indicators */}
        <div className="absolute bottom-6 right-6 flex space-x-2">
          {PHASES.map((phase, index) => (
            <div 
              key={phase.id}
              className="w-2 h-2 rounded-full transition-opacity duration-300"
              style={{ 
                backgroundColor: phase.color,
                opacity: index <= currentPhaseIndex ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DataJourney);