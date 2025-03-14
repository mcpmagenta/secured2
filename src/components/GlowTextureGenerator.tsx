"use client";

import React, { useRef, useEffect } from 'react';

/**
 * Component to generate a glow texture and save it to public folder
 * This is a utility component that should be rendered once to generate the texture
 */
const GlowTextureGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    // Add color stops
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Convert to data URL
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dataUrl = canvas.toDataURL('image/png');
    
    // Display instructions for saving
    console.log('Glow texture generated. Right-click on the image and save as "glow.png" in the public folder.');
  }, []);
  
  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-white text-lg mb-4">Glow Texture Generator</h2>
      <p className="text-gray-300 mb-4">
        Right-click on the image below and save it as &quot;glow.png&quot; in the public folder.
      </p>
      <canvas 
        ref={canvasRef} 
        className="border border-gray-700 bg-black"
        style={{ width: '256px', height: '256px' }}
      />
    </div>
  );
};

export default GlowTextureGenerator;
