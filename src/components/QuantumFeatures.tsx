import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Define the feature type
interface Feature {
  number: string;
  title: string;
  description: string;
  color: string;
}

// Component for displaying quantum-secure features with 3D-like effects
const QuantumFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Features data
  const features: Feature[] = [
    {
      number: '01',
      title: 'Quantum-Secure® Data Protection',
      description: 'Our patented technology secures your data against quantum computing threats with advanced encryption that cannot be broken, even by quantum computers.',
      color: '#4dabf7'
    },
    {
      number: '02',
      title: 'Quantum-Secure® Mesh Networking',
      description: 'Create resilient, self-healing networks with our quantum-secure mesh technology that distributes data across multiple secure nodes.',
      color: '#ae3ec9'
    },
    {
      number: '03',
      title: 'Quantum-Secure® Communications',
      description: 'End-to-end encrypted communications channels that remain secure even against quantum computing attacks and advanced AI-based threats.',
      color: '#20c997'
    }
  ];
  
  // Auto-rotate through features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [features.length]);
  
  // Handle manual feature selection
  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
  };
  
  return (
    <div className="w-full py-16 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-500/30"
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: `${Math.random() * 100}%`,
              opacity: 0.3
            }}
            animate={{ 
              y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-4">
        {/* Title section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Quantum-Secure® Technology
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Our revolutionary approach to quantum-secure data protection
          </p>
        </div>
        
        {/* Features navigation */}
        <div className="flex justify-center space-x-4 mb-12">
          {features.map((feature, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeFeature === index 
                  ? 'bg-blue-500 w-10'
                  : 'bg-gray-600'
              }`}
              onClick={() => handleFeatureClick(index)}
              aria-label={`View feature ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Feature cards */}
        <div className="relative h-[500px] mx-auto max-w-5xl">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="absolute top-0 left-0 w-full h-full"
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ 
                opacity: activeFeature === index ? 1 : 0,
                scale: activeFeature === index ? 1 : 0.8,
                rotateY: activeFeature === index ? 0 : -30,
                z: activeFeature === index ? 0 : -100
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ 
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center'
              }}
            >
              <div 
                className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 flex flex-col md:flex-row items-center"
                style={{ 
                  boxShadow: `0 10px 50px -5px ${feature.color}40`,
                  perspective: '1000px'
                }}
              >
                {/* Feature number */}
                <div className="mb-6 md:mb-0 md:mr-8">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                    style={{ 
                      background: `linear-gradient(135deg, ${feature.color}30, ${feature.color}10)`,
                      border: `2px solid ${feature.color}` 
                    }}
                  >
                    {feature.number}
                  </div>
                </div>
                
                {/* Feature content */}
                <div className="flex-1">
                  <h3 
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ color: feature.color }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {feature.description}
                  </p>
                  
                  {/* Decorative elements */}
                  <div className="mt-8 flex items-center">
                    <div 
                      className="w-12 h-1 rounded"
                      style={{ backgroundColor: feature.color }}
                    />
                    <div className="ml-4">
                      <motion.div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: feature.color }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 3D decorative elements */}
                <motion.div 
                  className="absolute -right-10 -bottom-10 w-40 h-40 opacity-30"
                  style={{ 
                    background: `radial-gradient(circle, ${feature.color}80 0%, transparent 70%)`,
                    filter: 'blur(20px)'
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <div className="flex justify-between max-w-5xl mx-auto mt-8">
          <button 
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            onClick={() => setActiveFeature((prev) => (prev - 1 + features.length) % features.length)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            onClick={() => setActiveFeature((prev) => (prev + 1) % features.length)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantumFeatures;
