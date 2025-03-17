'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Navigation component with no SSR
const Navigation = dynamic(() => import('./Navigation'), { ssr: false });

// Client-side only wrapper for Navigation
export default function ClientNavigation() {
  return <Navigation />;
}
