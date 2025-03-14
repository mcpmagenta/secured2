"use client";

import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import type { Engine } from 'tsparticles-engine';

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await import('tsparticles').then((module) => module.loadFull(engine));
  }, []);

  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: {
            color: '#000000',
          },
          fullScreen: {
            enable: false,
            zIndex: -1,
          },
          particles: {
            color: {
              value: '#ffffff',
            },
            links: {
              color: '#ffffff',
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            collisions: {
              enable: true,
            },
            move: {
              direction: 'none',
              enable: true,
              outMode: 'bounce',
              random: false,
              speed: 1,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                value_area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.3,
            },
            shape: {
              type: 'circle',
            },
            size: {
              value: 3,
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}
