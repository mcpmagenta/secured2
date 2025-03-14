import React from 'react';

// This declaration allows TypeScript to understand dynamic imports of .tsx files
declare module '*.tsx' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: React.ComponentType<any>;
  export default component;
}

// We're using the general module declaration above for all .tsx files
// No specific declaration needed for ThreeJSCanvas