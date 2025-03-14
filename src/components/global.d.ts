import React from 'react';

// This declaration allows TypeScript to understand dynamic imports of .tsx files
declare module '*.tsx' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: React.ComponentType<any>;
  export default component;
}

// Specific declaration for ThreeJSCanvas
declare module './ThreeJSCanvas' {
  interface ThreeJSCanvasProps {
    progress: number;
    currentPhase: string;
    phaseColors: { [key: string]: string };
  }
  
  const ThreeJSCanvas: React.ComponentType<ThreeJSCanvasProps>;
  export default ThreeJSCanvas;
}